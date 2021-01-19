import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';

// @ObjectType tells GraphQL that is a type. We can stach decorators btw!
@ObjectType()
@Entity()
export class Post {
  @Field()
  @PrimaryKey()
  id!: number;

  // @Field() is exposing it to our graphQL schema. Ommiting it will not return it while querying.
  // () => String explicitly sets a type for GraphQL
  @Field(() => String)
  @Property({ type: 'date' })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() }) // onUpdate its a hook that fires on update!
  updatedAt = new Date();

  @Field()
  @Property({ type: 'text' })
  title!: string;
}
