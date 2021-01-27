import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import { useMeQuery, useLogoutMutation } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery({
    // Beacouse we enabled ssr on index page, it will make a request on next.js server when we go there and be server side rendered
    // However our Next js server does not have a cookie, so it will return null.
    // It makes an unnecessary request on server tro get a user and we don't need that.
    // pause: true makes it not run on the server
    // It is not important for SEO to have user details, so we disabe it!
    // Now when we are on the server it will run(window === 'undefined) and when we are on browser it will not.\
    // ---
    pause: isServer(),
    // ---
    // We can remove pause: isServer() now, beacouse now we are forwarding the cookie in createUrqlClient,
    // So it will know what user we are!
  });
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
      <Flex align='center'>
        <NextLink href='/create-post'>
          <Button as={Link} mr={2}>
            Create post
          </Button>
        </NextLink>
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
    <Flex
      position='sticky'
      zIndex={10}
      top={0}
      bgGradient='linear(to-r, teal.500,green.500)'
      p={4}
      align='center'
      justify='center'
    >
      <Flex flex={1} maxW={800} align='center'>
        <NextLink href='/'>
          <Link>
            <Heading> Forum </Heading>
          </Link>
        </NextLink>
        <Box ml='auto'>{body}</Box>
      </Flex>
    </Flex>
  );
};
