import { dedupExchange, fetchExchange, Exchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
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
      updates: {
        Mutation: {
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
