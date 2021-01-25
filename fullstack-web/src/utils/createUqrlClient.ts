import {
  dedupExchange,
  fetchExchange,
  Exchange,
  stringifyVariables,
} from 'urql';
import { cacheExchange, Resolver } from '@urql/exchange-graphcache';
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQuery';
import { pipe, tap } from 'wonka';
// This is Next global router
import Router from 'next/router';

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

export const createUrqlClient = (ssrExchange: any) => ({
  // We point it to our server!
  url: 'http://localhost:4000/graphql',
  fetchOptions: {
    credentials: 'include' as const,
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
          createPost: (_result, args, cache, info) => {
            const allFields = cache.inspectFields('Query');
            const fieldInfos = allFields.filter(
              (info) => info.fieldName === 'posts'
            );
            // We loop for each field in posts and invalidate cache
            fieldInfos.forEach((fi) => {
              cache.invalidate('Query', 'posts', fi.arguments || {}); // || {} is bc fi.arguments is possibly null
            });
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
});
