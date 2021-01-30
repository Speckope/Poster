import { MyContext } from 'src/types';
import { MiddlewareFn } from 'type-graphql';

// This run before our resolver, we can now wrap our resolvers in it.
// Context is what we pass in new ApolloServer
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('not authenticated');
  }

  return next();
};
