import { Box, Button, Flex, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import { useMeQuery, useLogoutMutation } from '../generated/graphql';

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();
  // We get fetching as logoutFetching (just a name change)
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

  let body = null;
  //  Data is loading
  if (fetching) {
    // User not logged in
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href='/login'>
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href='/register'>
          <Link>Register</Link>
        </NextLink>
      </>
    );
    // User logged in
  } else {
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          isLoading={logoutFetching}
          onClick={() => {
            logout();
          }}
          variant='link'
        >
          Logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex bgGradient='linear(to-r, teal.500,green.500)' p={4}>
      <Box ml='auto'>{body}</Box>
    </Flex>
  );
};
