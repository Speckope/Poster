import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import microConfig from './mikro-orm.config';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  // Here we have access to all the post fields. This creates an instance of a Post
  const post = orm.em.create(Post, { title: 'Firsto Posto' });
  // This inserts  it into the db
  await orm.em.persistAndFlush(post);

  const posts = await orm.em.find(Post, {});
  console.log(posts);
};

main();

console.log('hello world');
