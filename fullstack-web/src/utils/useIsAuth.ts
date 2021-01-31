import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useMeQuery } from '../generated/graphql';

export const useIsAuth = () => {
  // If Urql did me request before, it will cache it and not run a second time!
  const [{ data, fetching }] = useMeQuery();
  const router = useRouter();
  useEffect(() => {
    // If user is not logged in we take them to a login page
    // Also if it is not fetching currently. Otherwise it would make a query, be fetching
    // and take user to login before we got his data back
    if (!data?.me && !fetching) {
      // router.pathname is pathname of the current site
      // router.replace('/login?next=', router.pathname) will tell where user should be redirected after login!
      // (We added a query parameter)
      router.replace('/login?next=' + router.pathname);
    }
  }, [data, router]);
};

// import { useRouter } from 'next/router';
// import { useEffect, useState } from 'react';
// import { useMeQuery } from '../generated/graphql';

// export const useIsAuth = () => {
//   const [{ data }, fetching] = useMeQuery();
//   const [isAuth, setIsAuth] = useState<boolean>(false);

//   useEffect(() => {
//     if (!data?.me && !fetching) {
//       setIsAuth(false);
//     }
//   }, [data, fetching]);

//   return [isAuth];
// };
