import { UsernamePasswordInput } from 'src/resolvers/UsernamePasswordInput';
import { emailIsValid } from '../utils/emailIsValid';

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!emailIsValid(options.email)) {
    return [
      {
        field: 'email',
        message: 'Invallid email.',
      },
    ];
  }

  if (options.username.length < 3) {
    return [
      {
        field: 'username',
        message: 'Username should be at least 2 characters long.',
      },
    ];
  }

  if (options.username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'Username cannot include @.',
      },
    ];
  }

  if (options.password.length < 3) {
    return [
      {
        field: 'password',
        message: 'Password should be at least 3 characters long.',
      },
    ];
  }

  // If none of the above happer we return null
  return null;
};
