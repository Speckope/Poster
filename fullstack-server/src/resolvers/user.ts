import { User } from '../entities/User';
import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import * as argon2 from 'argon2';
// This import is for creating queries ourselves
import { getConnection } from 'typeorm';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { v4 } from 'uuid';
import { sendEmail } from '../utils/sendEmail';

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
  //
  //
  // CHANGE PASSWORD
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    // Password too short
    if (newPassword.length < 3) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'Password should be at least 3 characters long.',
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    // We get from redis user id we stored under token
    const userId = await redis.get(key);
    // Problem with a token.
    // Eirher token expired or token is invalid(someone messed with it). So we will just send token expired!
    // Message suitable for standard user.
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    // If we got here, we have userId
    // We parseInt(userId) beacouse Redis stores it as string and we set it as number!
    // We know that it stores it as string from error TS message.
    // AND if we hover this const userId = await redis.get(FORGET_PASSWORD_PREFIX + token)
    // We see that it returns a string thanks to TS!
    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    // If for some reason we dont get user it may be beacouse user got deleted in time period of password change
    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      };
    }

    // Save user
    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) } // Hash a password
    );

    // We delete token from db, so it's not possible to change password again!
    await redis.del(key);

    // Log in user after password change, so we set their session
    req.session.userId = user.id;

    return { user };
  }

  // FORGOT PASSWORD
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    // If what we searcj by isn't primary key we have to say where
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // If no user there is no email
      // We can handle this depending on our specific application
      // If we return true we don't tell that email exists. This way hacker won't know if such an email is in our db
      return true;
    }

    // WE send email we got from input
    // And give them link to go on site like this:
    // <a href='http://localhost:3000/change-password/96dsf342'>reset password</a>
    // So we will give them unique token to validate that user is user and we will store this token in redis!
    const token = v4(); // uuid v4 will create unique tring and its good for creating things like that!
    //
    await redis.set(
      // We pass token with prefix, prefix so we can easily find it in db if needed
      FORGET_PASSWORD_PREFIX + token,
      // here we pass value we want to store. user.id in our example, we we will know what user it is
      user.id,
      // Expiration mode. It will expire after set time.
      'ex',
      // Time after which token will expire
      1000 * 60 * 60 * 24 * 3 // 3 days
    );

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    ).catch((err) => {
      console.log(err);
    });

    return true;
  }

  // Get one user
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // Means we are not logged in
    if (!req.session.userId) {
      return null;
    }

    // Find by id
    // We don't have to say await, it returns a Promise of the user and that's good
    return User.findOne(req.session.userId);
  }

  // Register user
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);

    let user;
    try {
      // OTHER METHOD OF CREATING A QUERY. BUILD QUERY YOURSELF. USING A QUERY BUILDER
      // We get connection globally, alternatively we could pass conn through the context!
      // User.create({}).save() // does the same!
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(
          // If we update one, pass just one object. If more, pass an array of objects
          {
            username: options.username,
            email: options.email,
            password: hashedPassword,
            // We have to add underscored so it's correct column. orm switches it for us
            // here it has to be explicit column type!
            // createdAt and updatedAt will be handled for us!
          }
        )
        .returning('*') // We specify what we want to return. It will be stored in result
        .execute();
      console.log(result);
      user = result.raw[0];
    } catch (err) {
      console.log('err: ', err);
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

  // Login user
  // So here we pass ObjectType we created!
  @Mutation(() => UserResponse)
  async login(
    // WE wijll accept email or username as a login
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ) {
    const user = await User.findOne(
      // We conditianally serach by email or by name depending what they type
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) {
      // And here we return specifics from our UserResponse ObjectType
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: "Username or email doesn't exist.",
          },
        ],
      };
    }
    // user.password is from db. options.password is passed from user.
    const valid = await argon2.verify(user.password, password);
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

  // Logout user
  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    // we create and return new promise. This resolver will wait for this promise to finish.
    // And will wait for callback (err) => void to finish
    return new Promise((resolve) =>
      // This function destroys cookie on our redis server, so it no longer can return session data!
      // It means we theoretically could get cookie value from res, decrypt it, find it in our redis db and delete!
      req.session.destroy((err) => {
        // This destroys the cookie!
        res.clearCookie(COOKIE_NAME);
        if (err) {
          // we return false from the promise if we got an error
          resolve(false);
          return;
        }
        // we return true if it was successful
        resolve(true);
      })
    );
  }
}
