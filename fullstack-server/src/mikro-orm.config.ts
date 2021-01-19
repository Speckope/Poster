import { __prod__ } from './constants';
require('dotenv').config({ path: __dirname + '/../.env' });
import { Post } from './entities/Post';
import { MikroORM } from '@mikro-orm/core';
import path from 'path';
import { User } from './entities/User';

export default {
  migrations: {
    path: path.join(__dirname, './migrations'), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
  },

  entities: [Post, User],
  dbName: 'forum',
  type: 'postgresql',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  debug: !__prod__,
  // We cast it to the same type it expects where we import it!!
  // We get typeof function MikroORM.init and typeof returns an array we get first argument!\
} as Parameters<typeof MikroORM.init>[0]; // Cool!!

// export default {
//   entities: [Post],
//   dbName: 'forum',
//   type: 'postgresql',
//   user: 'postgres',
//   password: 'HalucynogennyWieloryb',
//   debug: !__prod__,
//   // when we cast into a const it makes type more specific and solves problems
//   // when TS types doesn't line up
// } as const;
