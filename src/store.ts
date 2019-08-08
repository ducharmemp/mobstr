import { observable, action } from "mobx";
import { flatMap } from "lodash";

import { Meta } from "./meta";
import { ensureMeta } from "./utils";

/**
 *
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
 *
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
 *
 * @param store
 * @param entities
 */
export const removeAll = action(
  <T>(store: ReturnType<typeof createStore>, entities: T[]) => {
    entities.forEach(removeOne.bind(null, store));
  }
);

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
 *  Finds all entieis in the store by a given findClause
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
