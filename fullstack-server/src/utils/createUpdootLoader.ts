import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';

// Pass [{postId: 5, userId: 10}, {}...]
// And return and Updoot [{postId: 5, userId::10 , value: 1}]. Value can also be 0 if post was not voted.

export const createUpdootLoader = () =>
  // We have to know both postId and userId, so we pass an object
  // And we return number or null
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any[]); // we wrote as string[] bc it expected something not read only
      const updootsIdsToUpdoot: Record<string, Updoot> = {};
      updoots.forEach((updoot) => {
        // The key will have to be joint of postId and userId
        // So we create a string wich userId and postId
        updootsIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
      });

      return keys.map(
        (key) => updootsIdsToUpdoot[`${key.userId}|${key.postId}`]
      );
    }
  );

// Overally:
// 1. create a loader
// 2. Define how to batch all the calls into a single sql statement
// 3. Return the data in the correct order, that matches the order of the keys
// 4. Pass it through the context in index, so it is created on every single request
// 5. Access it in resolver.

//* Field resolvers only run when we include them in the query, so
// if we don't include Creator in post query, it won't run and won't be fetched!
