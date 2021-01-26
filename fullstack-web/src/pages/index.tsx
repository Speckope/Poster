import { withUrqlClient } from 'next-urql';
import { Layout } from '../components/Layout';
import { createUrqlClient } from '../utils/createUqrlClient';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePostsQuery } from '../generated/graphql';
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { UpdootSection } from '../components/UpdootSection';

const Index = () => {
  // So we wil be changing variables to get a new query with next pages
  // Type 'string' is not assignable to type 'null'. We solver this Ts error with this "cursor: null as string | null"
  // with casting it to string or null
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });

  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  // If statement just in case something went wrong
  if (!fetching && !data) {
    return <div>There are no posts.</div>;
  }

  return (
    <Layout>
      <Flex justify='space-between' align='flex-end' mb={2}>
        <Box>
          <Heading>Forum</Heading>
        </Box>
        <Box>
          <NextLink href='/create-post'>
            <Link>Create post</Link>
          </NextLink>
        </Box>
      </Flex>
      {!data && fetching ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {/* We add ! bc we know it will be defined */}
          {data!.posts.posts.map((post) => (
            <Flex key={post.id} p={5} shadow='md' borderWidth='1px'>
              <UpdootSection post={post} />
              <Box>
                <Heading fontSize='xl'>{post.title}</Heading>
                <Text> Posted by: {post.creator.username} </Text>
                {/* We fetch only a small size of the post. (it's set up on the backend ) */}
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
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
