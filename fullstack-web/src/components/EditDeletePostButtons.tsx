import React from 'react';
import NextLink from 'next/link';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Flex, Link, IconButton, Box } from '@chakra-ui/react';
import { useDeletePostMutation, useMeQuery } from '../generated/graphql';

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  // WE don't have to worry about having this query in many components bc it will be cached by urql and not run again!
  const [{ data: meData }] = useMeQuery();

  const [, deletePost] = useDeletePostMutation();

  /* // Show edit and delete buttons only if logged in user is the owner of the post */
  if (meData?.me?.id !== creatorId) {
    return null;
  }

  return (
    <Flex flexDir='column' justifyContent='space-between'>
      <NextLink href='/post/edit/[id]' as={`/post/edit/${id}`}>
        <Link>
          <IconButton
            as={Link}
            colorScheme='orange'
            aria-label='Edit Post'
            icon={<EditIcon color='white' w={6} h={6} />}
            border='1px'
            borderColor='gray.200'
          />
        </Link>
      </NextLink>

      <Box>
        <IconButton
          onClick={() => {
            deletePost({ id });
            console.log('click');
          }}
          colorScheme='red'
          aria-label='Delete Post'
          icon={<DeleteIcon color='white' w={6} h={6} />}
          border='1px'
          borderColor='gray.200'
        />
      </Box>
    </Flex>
  );
};
