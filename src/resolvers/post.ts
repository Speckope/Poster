import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { Post } from '../entities/Post';
import { MyContext } from '../types';

@Resolver()
export class PostResolver {
  // Find all posts
  @Query(() => [Post])
  // We get Ctx from this context: () => ({ em: orm.em }) in createSchema in index.ts
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    // Destructure em from orm.em
    return em.find(Post, {});
  }

  // Find one post by id
  @Query(() => Post, { nullable: true }) // { nullable: true } is how we say it can return null
  //Inside a function we pass arguments we give it!
  post(
    // In GraphQl we mark agruments like with @Arg
    @Arg('id', () => Int) id: number, //  () => Int says it's an integer. However, both strings and int can be ommited. GraphQL will know this from TS type
    @Ctx() { em }: MyContext
  ): // This is what we're going to return. Whole thing is f(): Promise<Post | null> {}. It may be hard to see at first!
  Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  // Create a post!
  // Queries are for getting data, mutations for updating/inserting/deleting
  @Mutation(() => Post) // { nullable: true } is how we say it can return null
  async createPost(
    @Arg('title', () => String) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  // Update a post
  @Mutation(() => Post, { nullable: true }) // { nullable: true } is how we say it can return null
  async updatePost(
    // To have 2 more arguments just add like this
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string, // When nullable we have to declare type in 2nd argument
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    // If post is not found return null!
    if (!post) {
      return null;
    }
    // If we were given title, we update it!
    if (typeof title !== 'undefined') {
      post.title = title;
      // And save it.
      await em.persistAndFlush(post);
    }
    return post;
  }

  // And we delete a post like this!
  @Mutation(() => Boolean) // We return boolean whether it worked or not
  async deletePost(
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    await em.nativeDelete(Post, { id });
    return true;
  }
}
