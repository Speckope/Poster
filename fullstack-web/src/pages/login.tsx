import { Box, Button, Link } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import React from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { MeDocument, MeQuery, useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { withApollo } from '../utils/withApollo';

const Login: React.FC<{}> = ({}) => {
  const router = useRouter();
  // We use hook from urql
  const [login] = useLoginMutation(); // We use register to make a call
  // If u don't know where auery is just console.log router!
  // console.log(router);

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ usernameOrEmail: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          // This is how we pass variables if we specified option object in graphQl mutations
          const response = await login({
            variables: values,
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                // We stick in the cache for the meQuery
                query: MeDocument,
                // This is the shape of the data it expects
                data: {
                  __typename: 'Query',
                  me: data?.login.user,
                },
              });
              cache.evict({ fieldName: 'posts:{}' });
            },
          }); // It will trigger the mutation
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            // We navigate to page we specified in page before we were redirected by is isAuth
            if (typeof router.query.next === 'string') {
              // If its not a string, it is undefined, so it it now there!
              router.push(router.query.next);
            } else {
              // WE navigate to landing page if no query next has been specified
              router.push('/');
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name='usernameOrEmail'
              placeholder='username or email'
              label='Username or Email'
            />
            <Box mt={4}>
              <InputField
                name='password'
                placeholder='pasword'
                label='Password'
                type='password'
              />
            </Box>
            <Box mt={2}>
              <NextLink href='/forgot-password'>
                <Link>Forgot Password</Link>
              </NextLink>
            </Box>
            <Button
              mt={3}
              type='submit'
              colorScheme='teal'
              isLoading={isSubmitting}
            >
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withApollo({ ssr: false })(Login);
