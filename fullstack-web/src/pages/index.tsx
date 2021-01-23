import { withUrqlClient } from 'next-urql';
import { Layout } from '../components/Layout';
import { createUrqlClient } from '../utils/createUqrlClient';
import { Divider, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePostsQuery } from '../generated/graphql';

const Index = () => {
  const [{ data }] = usePostsQuery({
    variables: {
      limit: 10,
    },
  });

  return (
    <Layout>
      <NextLink href='/create-post'>
        <Link>Create post</Link>
      </NextLink>
      <div>hello world</div>
      {!data ? (
        <div>Loading...</div>
      ) : (
        data.posts.map((post) => <div key={post.id}> {post.title}</div>)
      )}
    </Layout>
  );
};

// This sets up provider on Index. { ssr: true } activates server side rendering!
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
