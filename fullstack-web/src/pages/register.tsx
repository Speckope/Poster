import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import React from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import { createUrqlClient } from '../utils/createUqrlClient';
import { withUrqlClient } from 'next-urql';

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  // We use hook from urql
  const [, register] = useRegisterMutation(); // We use register to make a call

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ email: '', username: '', password: '' }}
        // values is form state when user submits it
        onSubmit={async (values, { setErrors }) => {
          // setErrors is Formik thing!
          // We pass variables in mutation to register.
          // Here variables username and password line up in mutation and in values,
          // so we can just pass values
          const response = await register({ options: values }); // It will trigger the mutation
          // if (response.data.register.errors) will throw an error if error is undefined
          // if (response.data?.register.errors) will return undefined!
          if (response.data?.register.errors) {
            // We don't need ? marks below beacouse TS infers that error is defined
            // due to if statement above! Such a smart kid this TS!
            setErrors(toErrorMap(response.data.register.errors));
          } else if (response.data?.register.user) {
            // worked! We want to navigate to a landing page now
            router.push('/');
          }
        }}
      >
        {/* isSubmitting is a value that Formik gives us! We can pass it to 
        isLoading in Chakra or our custom loading hanlder on button!  */}
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name='username'
              placeholder='username'
              label='Username'
            />
            <Box mt={4}>
              <InputField name='email' placeholder='email' label='Email' />
            </Box>
            <Box mt={4}>
              <InputField
                name='password'
                placeholder='password'
                label='Password'
                type='password'
              />
            </Box>
            <Button
              mt={4}
              type='submit'
              colorScheme='teal'
              isLoading={isSubmitting}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
