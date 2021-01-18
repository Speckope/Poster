import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';

// @ObjectType tells GraphQL that is a type. We can stach decorators btw!
@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: 'date' })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() }) // onUpdate its a hook that fires on update!
  updatedAt = new Date();

  @Field()
  @Property({ type: 'text', unique: true }) //unique: true makes it unique...
  username!: string;

  // We won't allow to select a password, it's only a db column!
  @Property({ type: 'text' }) //unique: true makes it unique...
  password!: string;
}
