import { Query, Resolver } from 'type-graphql';

@Resolver()
export class HelloResolver {
  // Here we add methods that can be mutations or queries.

  // This means we have a query called hello that returns a String ('hello world')
  @Query(() => String) // Here we need to declare what our query returns
  hello() {
    return 'hello world';
  }
  // Now we import it to resolvers in our ApolloSever instance
}
