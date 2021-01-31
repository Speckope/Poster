import { useRouter } from 'next/router';

// Now we have logic of getting id, converting it to an int encapsulated
export const useGetIntId = () => {
  const router = useRouter();
  // Check if id exists in params and if it does, convert it to int(what our query expects)
  const intId =
    typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

  return intId;
};
