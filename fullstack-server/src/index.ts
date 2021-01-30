import 'reflect-metadata';
import 'dotenv-safe/config';
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
import path from 'path';
import { Updoot } from './entities/Updoot';
import { createUserLoader } from './utils/createCreatorLoader';
import { createUpdootLoader } from './utils/createUpdootLoader';

const main = async () => {
  const conn = await createConnection({
    // Type of our db
    type: 'postgres',
    port: 5432,
    // DB url
    url: process.env.DATABASE_URL,
    logging: true,
    migrations: [path.join(__dirname, './migrations/*')],
    // synchronize will create tables automatically and we don't  have to run z migration.
    // We don't want it in production!
    // synchronize: true,
    entities: [Post, User, Updoot],
  });
  // With connection we car run migrations
  // conn.migrations
  // await Post.delete({}); // deletes all posts
  await conn.runMigrations();

  const app = express();

  // We stick it here between app and ApolloServer.
  const RedisStore = connectRedis(session);
  // Creates on default on localhost
  const redis = new Redis(process.env.REDIS_URL);

  // In production we will gave ngnix sitting in front of our app, so we tell express
  // That there will be 1 proxy. This is for making sessions work
  app.set('proxy', 1);

  // Cors handling
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
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
        // We may have some problems with cookie while SSR and to fix that we can specify a custom domain
        // domain: __prod__ ? '.customdomain' : undefined
      },
      // It will create a session by default even if there is not any data, we set it so it does not.
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
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
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      // context will be run on every request, so new DataLoader instance will be created on every request!
      // DataLoader batches and caches loading of users within a single request
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }),
  });

  // This creates graphQL endpoint for us on express!
  // Now when we go to localhost:4000/grahql we have a graphql playground!!! :D
  // We can test our queries there.
  apolloServer.applyMiddleware({
    app,
    // Applies only to this route
    cors: false,
  });

  app.listen(parseInt(process.env.PORT), () => {
    console.log('Listening on localhost:4000...');
  });
};

main();
