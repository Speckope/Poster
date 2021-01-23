import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
} from '@chakra-ui/react';
import { useField } from 'formik';
import React, { InputHTMLAttributes } from 'react';
// GENERIC INPUT FIELD THAT IS NOW REUSABLE

// This means we want out inputProps to take any argument that a normal input prop would take
type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  // We manke name required, otherwise TS was complaining. Look at the end of error snippet
  name: string;
  label: string;
  textarea?: boolean;
};
// We do { label, ...props}  bc we want to have label off of props, beacouse there are some props that shouldn't go on input
// in this example its label! We also destructure size(it was conflicting with input) and set itm to _ as an unused variable!
export const InputField: React.FC<InputFieldProps> = ({
  label,
  textarea,
  size: _,
  ...props
}) => {
  let InputOrTextarea = Input;
  if (textarea) {
    InputOrTextarea = Textarea;
  }

  // field has a lor on it and we want to pass it all
  const [field, { error }] = useField(props);

  return (
    // We need a boolean here and no error will be empty string, so we cast it here to boolean
    // It converts it here to true or false
    <FormControl isInvalid={!!error}>
      {/* htmlFor mather id on input */}
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <InputOrTextarea {...field} {...props} id={field.name} />
      {/* Render props conditionally */}
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};
