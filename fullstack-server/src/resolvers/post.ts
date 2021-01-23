import { isAuth } from '../middleware/isAuth';
import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Post } from '../entities/Post';
import { getConnection } from 'typeorm';

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@Resolver()
export class PostResolver {
  // Find all posts
  @Query(() => [Post])
  async posts(
    @Arg('limit', () => Int) limit: number,
    // We could set offset, it's easy, but with offset we can run into performance problems
    // especially if there are frequent updates
    // Therefore we will use cursor based pagination
    // @Arg('offset') offset: number
    // With offset we say "give me gave after 10th post"
    // With cursor we give it location, which means 'give me every post after specified location
    // Type of cursor will depend of how we want to sort posts
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null // This is going to be a date, bc we will sort by the newest
  ): Promise<Post[]> {
    // We will let user pass whatever limit he wants, but under 50
    const realLimit = Math.min(50, limit);

    // const qb = getConnection()
    //     .getRepository(Post)
    //     // this is alias of how we wantn to call it
    //     .createQueryBuilder('p')
    //     .where('"createdAt" > :cursor', { cursor: parseInt(cursor); })
    //     // We need double quotes around specific words in postresql,
    //     // bc when it runs a sequel it lowercases it. Quotes will prevent it
    //     .orderBy('"createdAt"', 'DESC') // order by createdAt and descending
    //     .take(realLimit) // .take is recommended instead of .limit if we are doing pagination
    //     .getMany()

    // We construct our query conditionally!
    const qb = getConnection()
      .getRepository(Post)
      // this is alias of how we wantn to call it
      .createQueryBuilder('p')
      // We need double quotes around specific words in postresql,
      // bc when it runs a sequel it lowercases it. Quotes will prevent it
      .orderBy('"createdAt"', 'DESC') // order by createdAt and descending
      .take(realLimit); // .take is recommended instead of .limit if we are doing pagination

    if (cursor) {
      // cursor: new Date works for timestamp!
      qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }

    return qb.getMany();
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
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    // We spread input!
    return Post.create({ ...input, creatorId: req.session.userId }).save();
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
