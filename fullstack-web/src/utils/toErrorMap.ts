import { FieldError } from '../generated/graphql';

// Its an array of FieldErrors and we have it from hovering over error in register
// that we got from response from graphql server. It was created in generated.
export const toErrorMap = (errors: FieldError[]) => {
  const errorMap: Record<string, string> = {};
  // We get each object from an array and we destructure it!
  //   [{field: asd, message: asd},{field: asd, message: asd}] we got it from error from graphql!
  errors.forEach(({ field, message }) => {
    // And we make it into an object that Formik setErrors wants!
    errorMap[field] = message;
  });

  return errorMap;
};
