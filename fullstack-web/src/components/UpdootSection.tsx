import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton, Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import {
  PostSnippetFragment,
  PostsQuery,
  useVoteMutation,
} from '../generated/graphql';

interface UpdootSectionProps {
  // Here we select type that we want, we select type from PostQuery that was created when generating query
  // PostQuery is a type object. We select posts by key, and posts in posts object and we get an array
  // Than we select element no.1 from this array!
  // post: PostsQuery['posts']['posts'][0];
  //
  // Above solution is still correct, but
  // we added PostSnippet in fragments in graphql, so now we can use it.
  post: PostSnippetFragment;
}

// Now we give it as props the whole props object, so later if we need more than just points,
// we don't have to change types here, bc we passed whole post type!
export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  // We do it like this and not with fetching from urql, bc we don't know for
  // which vote it would be fetching, and we have to have a disctinction between them
  // bc we want to be laoding only one ofc.
  const [loadingState, setLoadingState] = useState<
    // Here we create union of types
    'updoot-loading' | 'downdoot-loading' | 'not-loading'
  >('not-loading');
  const [, vote] = useVoteMutation();

  return (
    <Flex direction='column' justify='center' align='center' mr={4}>
      <IconButton
        onClick={async () => {
          // We set loading
          setLoadingState('updoot-loading');
          // We use it as an async bc we will unset loading
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'updoot-loading'}
        aria-label='Upvote'
        icon={<ChevronUpIcon w={7} h={7} />}
      />
      <Box> {post.points} </Box>
      <IconButton
        onClick={async () => {
          setLoadingState('downdoot-loading');
          await vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'downdoot-loading'}
        aria-label='Downvote'
        icon={<ChevronDownIcon w={7} h={7} />}
      />
    </Flex>
  );
};
