import DataLoader from 'dataloader';
import { User } from '../entities/User';

// This is util creating DataLoader. We want it created on every request
// We have to pass batch load function inside Data loader
// It takes keys like an array [1,4,8,5] and returns user for each one of these keys,
// Here it will be objects of user [{id: 1, username: 'Ania'},{},{}]
export const createUserLoader = () =>
  // It gets a number(ids) and returns a User
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]); // we wrote as string[] bc it expected something not read only
    // console.log('1. users: ', users);
    // Now we create a map to make it easier.
    // Initialize object with type. In record we have a number(id) and User object
    const userIdToUser: Record<number, User> = {};
    // Map users and assign them to ids, So we will be able to map them in order of ids
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });

    // console.log('2. userIdToUser: ', userIdToUser);

    // We sort by id to have array of objects of Users in order that we passed id.
    // It matters bc it has to be the order posts are displayed on the site from top

    const sortedUsers = userIds.map((userId) => userIdToUser[userId]);

    // My alternative method without userIdToUser
    // const sortedUsers = userIds.map(
    //   (userId) =>
    //     users.filter((u) => {
    //       return u.id === userId;
    //     })[0]
    // );
    // console.log('3. Mapped userIds: ', sortedUsers);
    // We return an array of users.
    return sortedUsers;
  });
