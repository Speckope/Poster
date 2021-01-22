import 'reflect-metadata';
import dotenv from 'dotenv';
import { COOKIE_NAME, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from './types';
import cors from 'cors';
import { createConnection } from 'typeorm';
import { Post } from './entities/Post';
import { User } from './entities/User';

dotenv.config();
const main = async () => {
  const conn = createConnection({
    // Type of our db
    type: 'postgres',
    // Name of our db
    database: 'forum2',
    username: 'postgres',
    password: process.env.DB_PASSWORD,
    logging: true,
    // synchronize will create tables automatically and we don't  have to run z migration.
    synchronize: true,
    entities: [Post, User],
  });
  // With connection we car run migrations
  // conn.migrations

  const app = express();

  // We stick it here between app and ApolloServer.
  const RedisStore = connectRedis(session);
  // Creates on default on localhost
  const redis = new Redis();

  // Cors handling
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );

  app.use(
    session({
      // Name of our cookie(from constants, so if we change it in our constants it shall change everywhere!)
      name: COOKIE_NAME,
      // This is tellinf express-session we're using reddit
      store: new RedisStore({
        client: redis,
        // This will keep session for a long time so we won't have to touch the cookie to renew it!
        disableTouch: true,
      }),

      // Here we scecify our cookie options!
      cookie: {
        // It makes it so cookie will last 10y max
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10years
        // With this we won't be able to access the cookie on frontend
        httpOnly: true,
        sameSite: 'lax', // Ochrona przed atakami csrf
        // With secure cookie will work only in https
        secure: __prod__, // so we will use it only in production
      },
      // It will create a session by default even if there is not any data, we set it so it does not.
      saveUninitialized: false,
      secret: 'NianiaNana',
      resave: false,
    })
    // Now express-session will create a cookie!
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      // By defaul validation uses class validtors package
      validate: false,
    }),
    // context is a special object that's accessible by all resolvers
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  // This creates graphQL endpoint for us on express!
  // Now when we go to localhost:4000/grahql we have a graphql playground!!! :D
  // We can test our queries there.
  apolloServer.applyMiddleware({
    app,
    // Applies only to this route
    cors: false,
  });

  app.listen(4000, () => {
    console.log('Listening on localhost:4000...');
  });
};

main();
