import { Box, Button, Divider, Link } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { toErrorMap } from '../../utils/toErrorMap';
import { useToast } from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUqrlClient';
import NextLink from 'next/link';

// Notive it is NextPage!
const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const router = useRouter();

  // Chakra error message
  const toast = useToast();

  const [, changePassword] = useChangePasswordMutation();
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
            newPassword: values.newPassword,
            token,
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
ChangePassword.getInitialProps = ({ query }) => {
  return {
    // we cast it to string bd getInitialProps expects a 3 different types of props
    token: query.token as string,
  };
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
