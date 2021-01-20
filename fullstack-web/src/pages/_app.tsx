import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react';
import { createClient, dedupExchange, fetchExchange, Provider } from 'urql';
// For chaching
import { cacheExchange, Cache, QueryInput } from '@urql/exchange-graphcache';
import theme from '../theme';
import {
  LoginMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from '../generated/graphql';

// We make a function so exchanges will have better types
// So we make a wrapper function that returns a function we want to have better types
// so we don't get more errors. This way we set types to parameters as they should be,
// when we couldn't set them in an original function.
function betterUpdateQuery<Result, Query>( // We pass in two generics
  // cache(what login takes)
  cache: Cache,
  // qi is QueryInput, first parameter of updateQuery
  qi: QueryInput,
  result: any,
  // update function
  fn: (r: Result, q: Query) => Query // Here we use our generics
) {
  // And we return the function that we would normally call after lofin
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}

// Create urql client
const client = createClient({
  // We point it to our server!
  url: 'http://localhost:4000/graphql',
  fetchOptions: {
    credentials: 'include',
  },
  // This will allow managing caching, so we will be able to reset cache when we logout and login
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
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
    fetchExchange,
  ],
});

function MyApp({ Component, pageProps }: any) {
  return (
    <Provider value={client}>
      <ChakraProvider resetCSS theme={theme}>
        <ColorModeProvider
          options={{
            useSystemColorMode: true,
          }}
        >
          <Component {...pageProps} />
        </ColorModeProvider>
      </ChakraProvider>
    </Provider>
  );
}

export default MyApp;
