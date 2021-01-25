import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './Post';
import { Updoot } from './Updoot';

// @ObjectType tells GraphQL that is a type. We can stach decorators btw!
// Field() is also for graphQL
@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column() //unique: true makes it unique...
  username!: string;

  @Field()
  // Typeorm has default string so we dont have to explicitly write it!
  @Column({ unique: true })
  email!: string;

  // We won't allow to select a password, it's only a db column!
  @Column() //unique: true makes it unique...
  password!: string;

  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];

  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt = Date;

  @Field(() => String)
  // Typeorm has special column dete for dates!
  @UpdateDateColumn() // onUpdate its a hook that fires on update!
  updatedAt = Date;
}
