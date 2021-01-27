import { usePostQuery } from '../generated/graphql';
import { useGetIntId } from './useGetIntId';

// Now we have logic of getting id, converting it and using post query encapsulated in this custom hook!
export const useGetPostFromUrl = () => {
  const intId = useGetIntId();

  return usePostQuery({
    // If id is -1, it means we have bad url parameter from router,
    // so we won't even send a request, we will pause it.
    pause: intId === -1,
    variables: {
      id: intId,
    },
  });
};
