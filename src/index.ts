import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      // By defaul validation uses class validtors package
      validate: false,
    }),
    // context is a special object that's accessible by all resolvers
    context: () => ({ em: orm.em }),
  });

  // This creates graphQL endpoint for us on express!
  // Now when we go to localhost:4000/grahql we have a graphql playground!!! :D
  // We can test our queries there.
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('Listening on localhost:4000...');
  });
};

main();

console.log('hello world');
