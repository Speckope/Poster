import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { withApollo } from '../utils/withApollo';

const ForgotPassword: React.FC<{}> = ({}) => {
  const [complete, setComplete] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ email: '' }}
        onSubmit={async (values) => {
          // We won't be getting any errors from this!
          await forgotPassword({ variables: values });
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>Email has been sent on passed address.</Box>
          ) : (
            <Form>
              <Box mt={4}>
                <InputField
                  name='email'
                  placeholder='email'
                  label='Email'
                  type='email'
                />
              </Box>

              <Button
                mt={3}
                type='submit'
                colorScheme='teal'
                isLoading={isSubmitting}
              >
                Change password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withApollo({ ssr: false })(ForgotPassword);
