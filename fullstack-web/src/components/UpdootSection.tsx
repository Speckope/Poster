import { ApolloCache, gql } from '@apollo/client';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton, Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import {
  PostSnippetFragment,
  useVoteMutation,
  VoteMutation,
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

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  // We read fragment of data in data object inside cache!
  const data = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: number | null;
  }>({
    // Select if as it is in cache.data.data!
    id: 'Post:' + postId,
    // Now we read the data we need from an object 'Post:' + postId !
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });

  if (data) {
    // If user tries to vote again we return
    if (data.voteStatus === value) {
      return;
    }

    // We calculate new data we want to insert
    const newPoints =
      (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
    // And we write fragment!
    cache.writeFragment({
      // Select id of the Post object we want to modify
      id: 'Post:' + postId,
      // Select fields from the Post object
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      // This is new data that will be inserted!
      data: { points: newPoints, voteStatus: value },
    });
  }
};

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
  const [vote] = useVoteMutation();

  return (
    <Flex direction='column' justify='center' align='center' mr={4}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          // We set loading
          setLoadingState('updoot-loading');
          // We use it as an async bc we will unset loading
          await vote({
            variables: {
              postId: post.id,
              value: 1,
            },
            update: (cache) => updateAfterVote(1, post.id, cache),
          });
          setLoadingState('not-loading');
        }}
        border='1px'
        borderColor='gray.200'
        colorScheme={post.voteStatus === 1 ? 'teal' : undefined}
        isLoading={loadingState === 'updoot-loading'}
        aria-label='Upvote'
        icon={<ChevronUpIcon w={7} h={7} />}
      />
      <Box> {post.points} </Box>
      <IconButton
        onClick={async () => {
          // If user has already downdooted it, onClick won't work
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState('downdoot-loading');
          await vote({
            variables: {
              postId: post.id,
              value: -1,
            },
            update: (cache) => updateAfterVote(-1, post.id, cache),
          });
          setLoadingState('not-loading');
        }}
        border='1px'
        borderColor='gray.200'
        colorScheme={post.voteStatus === -1 ? 'red' : undefined}
        isLoading={loadingState === 'downdoot-loading'}
        aria-label='Downvote'
        icon={<ChevronDownIcon w={7} h={7} />}
      />
    </Flex>
  );
};
