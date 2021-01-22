import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm';

// @ObjectType tells GraphQL that is a type. We can stach decorators btw!
@ObjectType()
@Entity()
export class Post extends BaseEntity {
  // extends BaseEntity lest us run sql commands on Post like Post.find
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  // @Field() is exposing it to our graphQL schema. Ommiting it will not return it while querying.
  // () => String explicitly sets a type for GraphQL
  @Field(() => String)
  @CreateDateColumn()
  // I changed to Timestamp bc it was bugging out whem passing GMT date with JAN FIRDAY ...
  createdAt = Timestamp;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = Timestamp;

  @Field()
  @Column()
  title!: string;
}
