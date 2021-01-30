import { Field, InputType } from 'type-graphql';

// 2nd way of passing Args

@InputType()
export class UsernamePasswordInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}
