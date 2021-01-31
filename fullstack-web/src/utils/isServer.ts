export const isServer = () => typeof window === 'undefined';
// If it is undefined it means we are on the server
// If windows is active, it means we are not
