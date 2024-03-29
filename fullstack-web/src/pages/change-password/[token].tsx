import { Box, Button, Link } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import {
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
} from '../../generated/graphql';
import { toErrorMap } from '../../utils/toErrorMap';
import { useToast } from '@chakra-ui/react';
import NextLink from 'next/link';
import { withApollo } from '../../utils/withApollo';

// Notive it is NextPage!
// const ChangePassword: NextPage<{ token: string }> = () => {
const ChangePassword: NextPage = () => {
  const router = useRouter();

  // Chakra error message
  const toast = useToast();

  const [changePassword] = useChangePasswordMutation();
  // We create state for token error
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (tokenError) {
      toast({
        title: 'Error changing password',
        description: tokenError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [tokenError]);

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          //   // This is how we pass variables if we specified option object in graphQl mutations
          const response = await changePassword({
            variables: {
              newPassword: values.newPassword,
              // We get token from query params! And we check it if exists.
              token:
                // Next js KNOWS this query parameter is called token, bc this is how
                // we named our file(this page)!!!!
                typeof router.query.token === 'string'
                  ? router.query.token
                  : '',
            },
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                // We stick in the cache for the meQuery
                query: MeDocument,
                // This is the shape of the data it expects
                data: {
                  __typename: 'Query',
                  me: data?.changePassword.user,
                },
              });
              cache.evict({ fieldName: 'posts:{}' });
            },
          });
          if (response.data?.changePassword.errors) {
            // We need to display depending on different
            const errorMap = toErrorMap(response.data.changePassword.errors); // get object from an array
            // We need to handle token error differently
            // beacouse there is no token field that we are displaying, token is not in initial values
            // Therefore it won't be handled by Formik!
            if ('token' in errorMap) {
              // in checks if soe property is on an object
              setTokenError(errorMap.token); // We pass in error message for a token(that's how its mapped)
            }
            // We regardless set errors if there are some!
            setErrors(errorMap);
          } else if (response.data?.changePassword.user) {
            // worked! We want to navigate to a landing page now
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name='newPassword'
              placeholder='new password'
              label='New Password'
              type='password'
            />
            {tokenError ? (
              <Box>
                <Box style={{ color: 'red' }}>{tokenError}</Box>
                <NextLink href='/forgot-password'>
                  <Link>Click here to try again. </Link>
                </NextLink>
              </Box>
            ) : null}
            <Button
              mt={4}
              type='submit'
              colorScheme='teal'
              isLoading={isSubmitting}
            >
              Change Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// This is how we get our query parameter!
// There is also function for getting props from server or something like that if u need it
// ChangePassword.getInitialProps = ({ query }) => {
//   return {
//     // we cast it to string bd getInitialProps expects a 3 different types of props
//     token: query.token as string,
//   };
// };

// WE DONT NEED getInitialProps here, bc we can get token from the router
// If our page is does not getInitialProps  Next will optimize it and make it static!
// If we don't need getInitialProps, we don't want to do it!

export default withApollo({ ssr: false })(ChangePassword);
