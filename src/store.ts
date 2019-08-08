import { observable, action } from "mobx";
import { flatMap } from "lodash";

import { Meta } from "./meta";
import { ensureMeta } from "./utils";

/**
 * Creates a store for use with decorators and other helper functions. Meant to be used as a singleton,
 * but can also be used to create multiple distinct storage areas.
 *
 * @export
 * @returns
 */
export const createStore = action(() =>
  observable({
    collections: {} as Record<
      string | symbol | number,
      Map<string | symbol | number, any>
    >,
    primaryKeys: new Map(),
    indicies: new Map()
  })
);

/**
 * Adds a single entity to a collection in the store. If a collection does not exist in the
 * store object, it will be created.
 *
 * @param store
 * @param entity
 */
export const addOne = action(
  <T>(store: ReturnType<typeof createStore>, entity: T) => {
    ensureMeta(entity);
    const currentCollection = ((entity as unknown) as Meta).__meta__
      .collectionName;
    const currentKey = ((entity as unknown) as Meta).__meta__.key.get();
    store.collections[currentCollection as string] =
      store.collections[currentCollection as string] || observable.map();
    store.collections[currentCollection as string].set(
      (entity[currentKey as keyof T] as unknown) as string | number | symbol,
      entity
    );
  }
);

/**
 * Adds all entities in the list to the store in bulk.
 *
 * @param store
 * @param entity
 */
export const addAll = action(
  <T>(store: ReturnType<typeof createStore>, entities: T[]) => {
    entities.forEach(entity => addOne(store, entity));
  }
);

/**
 * Removes the given entity from the store. This function will cause an auto-cascade on all relationships
 * referencing this object. 
 * 
 * @param store
 * @param entity
 */
export const removeOne = action(
  <T>(store: ReturnType<typeof createStore>, entity: T) => {
    ensureMeta(entity);
    const primaryKey = ((entity as unknown) as Meta).__meta__.key.get() as keyof T;

    const currentCollection = ((entity as unknown) as Meta).__meta__
      .collectionName;
    (store.collections[currentCollection as string] || observable.map()).delete(
      // TODO: Properly type this, we need to check this beforehand to make sure that we can handle composite keys
      (entity[primaryKey] as unknown) as string | number | symbol
    );
  }
);

/**
 * Removes all given entities from the store in bulk. Entities can be homogenous in type
 * or multiple types.
 * 
 * @param store
 * @param entities
 */
export const removeAll = action(
  <T>(store: ReturnType<typeof createStore>, entities: T[]) => {
    entities.forEach(removeOne.bind(null, store));
  }
);

/**
 * Finds a single entry in the store by a given primaryKey. This can be useful in
 * situations where you know the primary key but don't wish to keep an object reference around,
 * such as in callback functions or factory functions.
 *
 * @example
 * class Foo {
 *  @primaryKey
 *  id = uuid();
 * }
 * 
 * const foo = new Foo();
 * addOne(foo);
 * findOne(Foo, foo.id);
 * 
 * @param store
 * @param entityClass
 * @param primaryKey
 */
export const findOne = action(
  <T>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    primaryKey: ReturnType<Meta["__meta__"]["key"]["get"]>
  ): T => {
    ensureMeta(entityClass);
    const currentCollection = ((entityClass as unknown) as Meta).__meta__
      .collectionName;
    return (
      store.collections[currentCollection as string] || observable.map()
    ).get(primaryKey as string);
  }
);

/**
 * Finds all entities in the store by a given findClause that acts as a filter. Default
 * filter is the identity function, which ensures that all entities will be returned.  
 * 
 * @example
 * class Foo {
 *  @primaryKey
 *  id = uuid();
 * }
 * 
 * const foos = [new Foo(), new Foo(), new Foo()];
 * addAll(foos);
 * findAll(Foo) === foos;
 *
 * @param store
 * @param entityClass
 * @param findClause The testing predicate for including entities
 */
export const findAll = action(
  <T>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    findClause: (arg0: T) => any = (entry: T) => entry
  ) => {
    ensureMeta(entityClass);
    const currentCollection = ((entityClass as unknown) as Meta).__meta__
      .collectionName;
    return Array.from(
      (
        store.collections[currentCollection as string] || observable.map()
      ).values()
    ).filter(findClause) as T[];
  }
);

/**
 * Joins two collections based on their applicable relationships.
 * Currently only works for left joins based on the parent entity.
 * 
 * @example
 * class Bar {
 *   @primaryKey
 *   id = uuid();
 * }
 * 
 * class Foo {
 *   @primaryKey
 *   id = uuid();
 * 
 *   @relationship(type => Bar)
 *   friends = []
 * }
 * 
 * const f = new Foo();
 * f.push(new Bar(), new Bar(), new Bar());
 * // Works:
 * join(Foo, Bar);
 * // Doesn't work
 * join(Bar, Foo);
 *
 * @export
 * @param {ReturnType<typeof createStore>} store
 * @param {*} entityClass
 * @param {*} childClass
 * @returns
 */
export const join = action(
  <T, K>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    joinClass: K
  ): [T, K][] => {
    ensureMeta(entityClass);
    ensureMeta(joinClass);
    const entityCollectionName = ((entityClass as unknown) as Meta).__meta__
      .collectionName;
    const entityCollection = Array.from(
      store.collections[entityCollectionName as string].values()
    );

    const childCollectionName = ((joinClass as unknown) as Meta).__meta__
      .collectionName;
    const childCollection = store.collections[childCollectionName as string];

    return flatMap(entityCollection, (entity: any) => {
      const joinRelationships = Object.values(
        (entity as Meta).__meta__.relationships
      ).filter(({ type }) => type === joinClass);

      return flatMap(joinRelationships, ({ keys }) =>
        keys.map(key => [entity, childCollection.get(key)])
      );
    });
  }
);
