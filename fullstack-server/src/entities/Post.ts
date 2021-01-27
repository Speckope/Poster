import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm';
import { Updoot } from './Updoot';
import { User } from './User';

// @ObjectType tells GraphQL that is a type. We can stach decorators btw!
@ObjectType()
@Entity()
export class Post extends BaseEntity {
  // extends BaseEntity lest us run sql commands on Post like Post.find
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  // TITLE
  @Field()
  @Column()
  title!: string;

  // TEXT OPF THE POST
  @Field()
  @Column()
  text!: string;

  // POINTS OF THE POST
  @Field()
  @Column({ type: 'int', default: 0 })
  points!: number;

  // This is only a graphql schema field, so we don't put @Column
  @Field(() => Int, { nullable: true })
  // This will be 1, -1 or null. If 1 we upvoted it, -1 we downvoted, if null we have not voted on it
  voteStatus: number | null;

  @Field()
  @Column()
  creatorId: number;

  // This overally sets up a Foreign key, which we soter above as creatorId!
  // () => User poinst it to a type we want it to be connected to(User)
  @Field() // If we add Field(), Typorm will fetch the user for us
  @ManyToOne(() => User, (user) => user.posts) // user => user.posts points to a key on User
  creator: User; // user it the name of the foreign key

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];

  // @Field() is exposing it to our graphQL schema. Ommiting it will not return it while querying.
  // () => String explicitly sets a type for GraphQL
  @Field(() => String)
  @CreateDateColumn()
  // I changed to Timestamp bc it was bugging out whem passing GMT date with JAN FIRDAY ...
  createdAt = Timestamp;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = Timestamp;
}
