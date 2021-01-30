import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from './Post';
import { User } from './User';

// Many to many relationship
// Posts can be updated by many users and user can update many posts
// user <-> posts
// user -> join table <- posts
// user -> updoot <- posts
// So updoots will be join table!
// In join tables we doint need PrimaryGeneratedColumn, we just need PrimaryColumn, which will be based on Foreign Key

// @ObjectType tells GraphQL that is a type. We can stach decorators btw!
@ObjectType() // Updoot doesn't need to be an object type, but it can be
@Entity()
export class Updoot extends BaseEntity {
  @Field()
  @Column({ type: 'int' })
  value: number;

  @Field()
  @PrimaryColumn()
  userId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.updoots)
  user: User;

  @Field()
  @PrimaryColumn()
  postId: number;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.updoots, {
    // This will make it so when post is deleted, updoots will be deleted as well!
    // This way we don't have to manualy delete updoot of a post in our resolver
    onDelete: 'CASCADE',
  })
  post: Post;
}

// 2 Primary Columns make it unique based on those 2 columns provided
