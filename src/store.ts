/**
 * @module store
 */
import { observable, action } from "mobx";
import { flatMap } from "lodash";

import { Meta, Store, Constructor } from "./types";
import {
  ensureMeta,
  getMeta,
  ensureCollection,
  ensureIndicies,
  ensureConstructorMeta
} from "./utils";

/**
 * Creates a store for use with decorators and other helper functions. Meant to be used as a singleton,
 * but can also be used to create multiple distinct storage areas.
 *
 * @export
 * @function
 * @returns
 */
export const createStore = action(
  (): Store =>
    observable({
      collections: {},
      primaryKeys: new Map(),
      indicies: {},
      triggers: new Map(),
      nextId: 0
    })
);

/**
 * Adds a single entity to a collection in the store. If a collection does not exist in the
 * store object, it will be created.
 *
 * @export
 * @function
 * @param {ReturnType<typeof createStore>} store The store instance to add the entity into
 * @param {T} entity The entity itself. Note that this does not require the constructing class.
 */
export const addOne = action(
  <T>(store: ReturnType<typeof createStore>, entity: T) => {
    ensureMeta(entity);
    ensureConstructorMeta(entity);
    ensureCollection(store, entity);
    ensureIndicies(store, entity);
    const currentMeta = getMeta(entity);
    const currentCollection = currentMeta.collectionName;
    const currentKey = currentMeta.key.get();
    const indicies = currentMeta.indicies;

    store.collections[currentCollection as string].set(
      (entity[currentKey as keyof T] as unknown) as string,
      entity
    );

    indicies.forEach(index => {
      store.indicies[currentCollection as string].set(
        (entity[index as keyof T] as unknown) as string,
        entity
      );
    });
  }
);

/**
 * Adds all entities in the list to the store in bulk.
 *
 * @export
 * @function
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
 * referencing this object if the relationship's options include `cascade: true`. This is a recursive function
 * in the cascading case and will force update all other relationships referencing the same child entity.
 *
 * @export
 * @function
 * @param store
 * @param entity
 */
export const removeOne = action(
  <T>(store: ReturnType<typeof createStore>, entity: T) => {
    ensureMeta(entity);
    ensureMeta(Object.getPrototypeOf(entity));
    ensureCollection(store, entity);
    const currentMeta = getMeta(entity);
    const primaryKey = currentMeta.key.get() as keyof T;
    const cascadeRelationshipKeys = Object.values(
      currentMeta.relationships
    ).filter(relationship => relationship.options.cascade);

    const currentCollection = currentMeta.collectionName;
    store.collections[currentCollection as string].delete(
      // TODO: Properly type this, we need to check this beforehand to make sure that we can handle composite keys
      (entity[primaryKey] as unknown) as string | number | symbol
    );

    // Clean up all references after the cascade. We do this after the initial delete to hopefully catch any circular relationships
    cascadeRelationshipKeys.forEach(relationship => {
      relationship.keys
        .map(key => findOne(store, relationship.type, key))
        .forEach(entity => removeOne(store, entity));
    });
  }
);

/**
 * Removes all given entities from the store in bulk. Entities can be homogenous in type
 * or multiple types. This will also cascade any deletions to the any children with `cascade: true`
 * relationships
 *
 * @export
 * @function
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
 * @export
 * @function
 * @example
 * ```typescript
 *
 * class Foo {
 *  @primaryKey
 *  id = uuid();
 * }
 *
 * const foo = new Foo();
 * addOne(foo);
 * findOne(Foo, foo.id);
 * ```
 *
 * @export
 * @function
 * @param store
 * @param entityClass
 * @param primaryKey
 */
export const findOne = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    primaryKey: ReturnType<Meta["__meta__"]["key"]["get"]>
  ): InstanceType<T> => {
    ensureMeta(entityClass);
    ensureCollection(store, entityClass);
    const currentCollection = getMeta(entityClass).collectionName;
    return store.collections[currentCollection as string].get(
      primaryKey as string
    );
  }
);

/**
 * Finds all entities in the store by a given findClause that acts as a filter. Default
 * filter is the identity function, which ensures that all entities will be returned.
 *
 * @export
 * @function
 * @example
 * ```typescript
 *
 * class Foo {
 *  @primaryKey
 *  id = uuid();
 * }
 *
 * const foos = [new Foo(), new Foo(), new Foo()];
 * addAll(foos);
 * findAll(Foo) === foos;
 * ```
 *
 * @param store
 * @param entityClass
 * @param findClause The testing predicate for including entities
 */
export const findAll = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    findClause: (arg0: T) => any = (entry: T) => entry
  ): InstanceType<T>[] => {
    ensureMeta(entityClass);
    ensureCollection(store, entityClass);
    const currentCollection = getMeta(entityClass).collectionName;
    return Array.from(
      store.collections[currentCollection as string].values()
    ).filter(findClause);
  }
);

/**
 * Joins two collections based on their applicable relationships.
 * Currently only works for left joins based on the parent entity.
 *
 * @example
 * ```typescript
 *
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
 * ```
 *
 * @export
 * @function
 * @param {ReturnType<typeof createStore>} store
 * @param {*} entityClass
 * @param {*} childClass
 * @returns
 */
export const join = action(
  <T extends Constructor<{}>, K extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    joinClass: K
  ): [InstanceType<T>, InstanceType<K>][] => {
    ensureMeta(entityClass);
    ensureMeta(joinClass);
    ensureCollection(store, entityClass);
    ensureCollection(store, joinClass);
    const entityCollectionName = getMeta(entityClass).collectionName;
    const entityCollection = Array.from(
      store.collections[entityCollectionName as string].values()
    );

    const childCollectionName = getMeta(joinClass).collectionName;
    const childCollection = store.collections[childCollectionName as string];

    return flatMap(entityCollection, (entity: any) => {
      const joinRelationships = Object.values(
        getMeta(entity).relationships
      ).filter(({ type }) => type === joinClass);

      return flatMap(joinRelationships, ({ keys }) =>
        keys.map(key => [entity, childCollection.get(key)])
      );
    });
  }
);

/**
 * Truncates a given collection in the store and triggers any observables watching this particular collection.
 * This is essentially a very fast form of mass deletion.
 *
 * @export
 * @function
 * @param store
 * @param entityClass
 */
export const truncateCollection = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T
  ) => {
    ensureMeta(entityClass);
    const currentCollectionName = getMeta(entityClass).collectionName;
    // Trigger any observables watching the store for this collection
    store.collections[currentCollectionName as string].clear();
  }
);
