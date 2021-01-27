import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import React, { useState } from 'react';
import { EditDeletePostButtons } from '../components/EditDeletePostButtons';
import { Layout } from '../components/Layout';
import { UpdootSection } from '../components/UpdootSection';
import { useMeQuery, usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUqrlClient';

const Index = () => {
  // So we wil be changing variables to get a new query with next pages
  // Type 'string' is not assignable to type 'null'. We solver this Ts error with this "cursor: null as string | null"
  // with casting it to string or null
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });

  // // Rename data as meData
  // const [{ data: meData }] = useMeQuery();

  const [{ data, error, fetching }] = usePostsQuery({
    variables,
  });

  // If statement just in case something went wrong
  if (!fetching && !data) {
    return (
      <div>
        <div>There are no posts.</div>;<div>{error?.message}</div>
      </div>
    );
  }

  return (
    <Layout>
      {/* <Flex justify='space-between' align='flex-end' mb={2}>
        <Box>
          <Heading>Forum</Heading>
        </Box>
        <Box>
          <NextLink href='/create-post'>
            <Link>Create post</Link>
          </NextLink>
        </Box>
      </Flex> */}
      {!data && fetching ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {/* We add ! bc we know it will be defined */}
          {/* !post ? null : this is bc cache.invalidate post will make it so deleted psot will be null, */}
          {data!.posts.posts.map((post) =>
            // Without this  !post ? null : there would be an error "Cannot read property id(or some else) of null
            // It was putting null as post, which would cause the error above. If we return null before it tries
            // To real property of null it's fine
            !post ? null : (
              <Flex key={post.id} p={5} shadow='md' borderWidth='1px'>
                <UpdootSection post={post} />
                <Box flex={1}>
                  <NextLink href='/post/[id]' as={`/post/${post.id}`}>
                    <Link>
                      <Heading fontSize='xl'>{post.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text> Posted by: {post.creator.username} </Text>
                  {/* We fetch only a small size of the post. (it's set up on the backend ) */}
                  <Text mt={4}>{post.textSnippet}</Text>
                </Box>

                <EditDeletePostButtons
                  creatorId={post.creator.id}
                  id={post.id}
                />
              </Flex>
            )
          )}
        </Stack>
      )}
      {/* So now we render based on hasMore as well! */}
      {data && data.posts.hasMore ? (
        // We dont display Button when we don't have any data yet. Just a Loader will be present
        <Flex justify='center'>
          <Button
            onClick={() => {
              // Here we pass variables specifying next pages
              setVariables({
                // limit stays the same
                limit: variables.limit,
                // We select all element after the last element in the list
                // and we get last element createdAt field bc it's the field we depend cursor on
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
            isLoading={fetching}
            mt={2}
          >
            Load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

// This sets up provider on Index. { ssr: true } activates server side rendering!
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
