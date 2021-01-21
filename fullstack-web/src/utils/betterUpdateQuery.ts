import { QueryInput, Cache } from '@urql/exchange-graphcache';

// We make a function so exchanges will have better types
// So we make a wrapper function that returns a function we want to have better types
// so we don't get more errors. This way we set types to parameters as they should be,
// when we couldn't set them in an original function.
export function betterUpdateQuery<Result, Query>(
  // cache(what login takes)
  cache: Cache,
  // qi is QueryInput, first parameter of updateQuery
  qi: QueryInput,
  result: any,
  // update function
  fn: (r: Result, q: Query) => Query // Here we use our generics
) {
  // And we return the function that we would normally call after lofin
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
