import {
  dedupExchange,
  fetchExchange,
  Exchange,
  stringifyVariables,
} from 'urql';
import { cacheExchange, Resolver, Cache } from '@urql/exchange-graphcache';
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  VoteMutationVariables,
  DeletePostMutationVariables,
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQuery';
import { pipe, tap } from 'wonka';
// This is Next global router
import Router from 'next/router';
import { gql } from '@urql/core';
import { isServer } from './isServer';

const errorExchange: Exchange = ({ forward }) => ($ops) => {
  return pipe(
    forward($ops),
    // This will run every time there's an error
    tap(({ error }) => {
      if (error?.message.includes('not authenticated')) {
        // replace will replace current route in history, not push another to history.
        // This way back button won't get it
        Router.replace('/login');
      }
    })
  );
};

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      'posts'
    );
    info.partial = !isItInTheCache;
    let hasMore = true;
    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, 'posts') as string[];
      const _hasMore = cache.resolve(key, 'hasMore');
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    });

    return {
      __typename: 'PaginatedPosts',
      hasMore,
      posts: results,
    };
  };
};

const invalidateAllPosts = (cache: Cache) => {
  const allFields = cache.inspectFields('Query');
  const fieldInfos = allFields.filter((info) => info.fieldName === 'posts');
  // We loop for each field in posts and invalidate cache
  fieldInfos.forEach((fi) => {
    cache.invalidate('Query', 'posts', fi.arguments || {}); // || {} is bc fi.arguments is possibly null
  });
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  // In ctx we have access to a lot of properties that Next.js server is sending
  // Here we want to add a cookie to our request, so when we are SSR, Next.js is sending it!
  // (When we Client Side Render, Browser communicates to graphQL directly and it send back a cookie
  // but when we SSR, first it communicates to Next.js and then to GraphQl, which sends cookie to Next.js
  // so we just pass it along from Next.js! )
  // --- works like this:
  // SSR: browser -> next.js  -> graphql api
  // Client Side Render: browser -> graphql api

  let cookie = '';
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }

  return {
    // We point it to our server!
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: 'include' as const,
      // If there is a cookie on Next.js server, we pass it in headers here!
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    // This will allow managing caching, so we will be able to reset cache when we logout and login
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        // Here are client side resolvers. They will run whenever selected queries are run
        // We can use it also for computed values for e.g. and compute them on client side.
        resolvers: {
          Query: {
            // Name of the query should match what name we have in our queries.
            // Here what we habe in posts.graphql
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            deletePost: (_result, args, cache, info) => {
              cache.invalidate({
                __typename: 'Post',
                id: (args as DeletePostMutationVariables).id,
              });
            },

            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                // Here we define what fragment we want to get(Post)
                // And what we want to get there(points)
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                // This is how we look up the post
                { id: postId }
              );
              console.log('data: ', data);
              // If we got data back, update points
              if (data) {
                // If vote status is 1 and we try to update it with one, we don't to anything
                if (data.voteStatus === value) {
                  // We return if
                  return;
                }

                // If we haven't voted, we should update by 1. If we did, we should update by 2 points!
                const newPoints =
                  data.points + (!data.voteStatus ? 1 : 2) * value;
                // Here we write fragment(update)
                cache.writeFragment(
                  // We select what we update
                  gql`
                    fragment _ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value }
                );
              }
            },

            createPost: (_result, args, cache, info) => {
              invalidateAllPosts(cache);
              // This will invalidate the Query Posts when we do createPost Mutation
              // It will be refetched!
              cache.invalidate('Query', 'posts', {
                // Here we pass variables for the query when it will refetch it!
                limit: 15,
              });
            },
            // Now on logout cache will be updated and oour navbar will re-render as well!
            logout: (_result, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },
            // Name should match our Mutation name
            login: (_result, args, cache, info) => {
              // On result is writted data from our query
              betterUpdateQuery<LoginMutation, MeQuery>( // This Types are also generated in from our schema!
                cache,
                {
                  // This is MeDocument type generated from out schema GraphQL queries
                  query: MeDocument,
                },
                _result,
                // This is updated funtion that will run every time we make a new query
                (result, query) => {
                  if (result.login.errors) {
                    // return a curret query if we fot an error (we don't do anything)
                    return query;
                  } else {
                    return {
                      // else write new query!
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPosts(cache);
            },

            register: (_result, args, cache, info) => {
              // On result is writted data from our query
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                {
                  // This is MeDocument type generated from out schema GraphQL queries
                  query: MeDocument,
                },
                _result,
                // This is updated funtion that will run every time we make a new query
                (result, query) => {
                  if (result.register.errors) {
                    // return a curret query if we fot an error (we don't do anything)
                    return query;
                  } else {
                    return {
                      // else write new query!
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
