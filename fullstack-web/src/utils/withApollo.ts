import { ApolloClient, InMemoryCache } from '@apollo/client';
import { NextPageContext } from 'next';
import { withApollo as createWithApollo } from 'next-apollo';
import { PaginatedPosts } from '../generated/graphql';

const client = (ctx: NextPageContext) =>
  new ApolloClient({
    uri: process.env.NEXT_PUBLIC_API_URL,
    credentials: 'include' as const,
    headers: {
      cookie:
        (typeof window === 'undefined' ? ctx.req?.headers.cookie : undefined) ||
        '',
    },
    cache: new InMemoryCache({
      typePolicies: {
        // Type of request
        Query: {
          // fields always go here
          fields: {
            // posts is the field form our Query
            posts: {
              // Here we specify arguments that are used to filter. Ww want to stick
              // arguments here that arre not specific to pagination
              // If we were doing the search, variables might be ['query', 'limit, 'cursor']
              // We want to join incomming and existing under different keys, based on what the query is.
              // So in search we would pass ['query']
              // We pass an empty array, bc limit and cursor are related to pagination
              keyArgs: [],
              // Write merge function for posts
              // existing is sometimes undefined, so we assign it PaginatedPosts | undefined
              merge(
                existing: PaginatedPosts | undefined,
                incoming: PaginatedPosts
              ): PaginatedPosts {
                // Here we return merged results!
                return {
                  ...incoming,
                  // existing can be undefined if there is nothing in the cache
                  // existing?.posts || [] will return empty array if existing is undefined. And will destructure empry array!
                  posts: [...(existing?.posts || []), ...incoming.posts],
                };
              },
            },
          },
        },
      },
    }),
  });

// withApollo is as creator of a HOC
export const withApollo = createWithApollo(client);
