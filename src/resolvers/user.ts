import { User } from '../entities/User';
import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import * as argon2 from 'argon2';

// 2nd way of passing Args
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

// We want to see error for a specific field
@ObjectType()
class FieldError {
  // This will represent what field is wrong
  @Field()
  field: string;

  // This is message that will acoompany specific field error
  @Field()
  message: string;
}

// We return ObjectType and use InputType as an argument!
// We want user returned if it worked properly and error returned if it failed
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    // Means we are not logged in
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    // We won't allow username shorter that 2 characters
    if (options.username.length < 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'Username should be at least 2 characters long.',
          },
        ],
      };
    }

    if (options.password.length <= 3) {
      return {
        errors: [
          {
            field: 'password',
            message: 'Password should be at least 3 characters long.',
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    // For now we only save username, bc we don't want to save plaintext password.
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    // We try our insert
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      // look up code and detail in console.log(err)
      //   we need if bc it can fail for other reasons!
      if (err.code === '23505' || err.detail.includes('already exists')) {
        // if this code it means its a duplicate
        return {
          errors: [
            {
              field: 'username',
              message: 'Username has already been taken.',
            },
          ],
        };
      }
    }

    // We login user after refister
    // Stored user id session, sets a cookie on the user and keeps them logged in
    req.session.userId = user.id;

    return { user };
  }

  // So here we pass ObjectType we created!
  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ) {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      // And here we return specifics from our UserResponse ObjectType
      return {
        errors: [
          {
            field: 'username',
            message: "Username doesn't exist.",
          },
        ],
      };
    }
    // user.password is from db. options.password is passed from user.
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        // And here we return specifics from our UserResponse ObjectType
        errors: [
          {
            field: 'password',
            message: "Password doesn't match.",
          },
        ],
      };
    }

    req.session.userId = user.id;

    // And return user that's also allowed bc of UserResponse!
    return { user };
  }
}
