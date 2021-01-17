import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

// @Entity tells micro-orm that it's a db table
@Entity()
export class Post {
  @PrimaryKey()
  id!: number;

  // createdAt and updatedAt are just standard fields that are good to have!
  @Property({ type: 'date' })
  createdAt = new Date();

  @Property({ type: 'date', onUpdate: () => new Date() }) // onUpdate its a hook that fires on update!
  updatedAt = new Date();

  // @Property() decorates it. Without it its just a field in a class!
  // With its a column in db!
  @Property({ type: 'text' })
  title!: string;
}
