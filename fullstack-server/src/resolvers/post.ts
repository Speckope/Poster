import { Arg, Int, Mutation, Query, Resolver } from 'type-graphql';
import { Post } from '../entities/Post';

@Resolver()
export class PostResolver {
  // Find all posts
  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    return Post.find();
  }

  // Find one post by id
  @Query(() => Post, { nullable: true }) // { nullable: true } is how we say it can return null
  //Inside a function we pass arguments we give it!
  post(
    // In GraphQl we mark agruments like with @Arg
    @Arg('id', () => Int) id: number //  () => Int says it's an integer. However, both strings and int can be ommited. GraphQL will know this from TS type
  ): // This is what we're going to return. Whole thing is f(): Promise<Post | null> {}. It may be hard to see at first!
  Promise<Post | undefined> {
    return Post.findOne(id);
  }

  // Create a post!
  // Queries are for getting data, mutations for updating/inserting/deleting
  @Mutation(() => Post) // { nullable: true } is how we say it can return null
  async createPost(@Arg('title') title: string): Promise<Post> {
    return Post.create({ title }).save();
  }

  // UPDATE POST. This is example with 2 SQL queries!!
  @Mutation(() => Post, { nullable: true }) // { nullable: true } is how we say it can return null
  async updatePost(
    // To have 2 more arguments just add like this
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string // When nullable we have to declare type in 2nd argument
  ): Promise<Post | null> {
    const post = await Post.findOne(id); // Same as await Post.findOne({where: {id}});
    // If post is not found return null!
    if (!post) {
      return null;
    }
    // If we were given title, we update it!
    if (typeof title !== 'undefined') {
      // Update the post with given id to the value title
      await Post.update({ id }, { title });
    }
    return post;
  }

  // DELETE POST
  @Mutation(() => Boolean) // We return boolean whether it worked or not
  async deletePost(@Arg('id') id: number): Promise<Boolean> {
    await Post.delete(id);
    return true;
  }
}
