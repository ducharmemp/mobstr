/**
 * @module store
 */
import { observable, action } from "mobx";
import flatMap from "lodash.flatmap";
import hasIn from "lodash.hasin";
import isEqual from "lodash.isequal";

import {
  Store,
  Constructor,
  PrimaryKey,
  RelationshipEntry,
  StoreOptions,
  TruncateOptions,
  OneOrMany,
  CascadeOptions
} from "./types";
import logger from "./logger";
import {
  getOnlyOne,
  getIndexKey,
  invariant,
  getPropertyValues,
  getCollectionName
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
  (options: StoreOptions = {}): Store =>
    observable({
      collections: {},
      primaryKeys: new Map(),
      indicies: {},
      triggers: new Map(),
      nextId: 0,
      foreignKeys: {},
      options
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
  <T extends InstanceType<Constructor<any>>>(
    store: ReturnType<typeof createStore>,
    entity: T
  ) => {
    createCollection(store, entity.constructor as Constructor<T>);
    const currentCollectionName = getCollectionName(
      entity.constructor as Constructor<T>
    );
    const { values, primaryKeyPropertyName } = store.collections[
      currentCollectionName
    ];
    const currentKeyValue = entity[primaryKeyPropertyName];
    const indicies = store.indicies[currentCollectionName];
    invariant(
      () => !!currentKeyValue,
      "Primary key for model should not be falsy. This can lead to unexpected behavior"
    );

    values.set(currentKeyValue, entity);
    Object.entries(indicies).forEach(
      ([ indexKey, { propertyNames, values } ]) => {
        const propertyValues = getPropertyValues(entity, propertyNames as OneOrMany<keyof T>);
        const currentPropertyValue = getIndexKey(propertyValues);
        if(!values.has(indexKey)) {
          values.set(indexKey, []);
        }
        values.get(indexKey)!.push(currentPropertyValue);
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
  <T extends InstanceType<Constructor<{}>>>(
    store: ReturnType<typeof createStore>,
    entity: T
  ) => {
    createCollection(store, entity.constructor as Constructor<T>);
    const currentCollectionName = getCollectionName(
      entity.constructor as Constructor<T>
    );
    const { primaryKeyPropertyName } = store.collections[currentCollectionName];
    const cascadeRelationshipKeys = Array.from(
      store.foreignKeys[currentCollectionName].values()
    ).filter(relationship => relationship.options.cascade);

    store.collections[currentCollectionName].values.delete(
      // TODO: Properly type this, we need to check this beforehand to make sure that we can handle composite keys
      (entity[primaryKeyPropertyName as keyof T] as unknown) as PrimaryKey
    );

    // Clean up all references after the cascade. We do this after the initial delete to hopefully catch any circular relationships
    cascadeRelationshipKeys.forEach(relationship => {
      Object.values(relationship.values)
        .flat(1)
        .map(key =>
          findOne(
            store,
            relationship.type as Constructor<{}>,
            key as keyof typeof relationship.type
          )
        )
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
 * Removes a single entry from the database that matches the given value.
 * Throws if multiple entries are found or if no entries are found.
 */
export const removeOneBy = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    propertyKey: keyof InstanceType<T>,
    value: any
  ) => {
    removeOne(store, findOneBy(store, entityClass, propertyKey, value));
  }
);

/**
 * Removes all entries that match a given value.
 */
export const removeAllBy = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    propertyKey: keyof InstanceType<T>,
    value: any
  ) => {
    removeAll(store, findAllBy(store, entityClass, propertyKey, value));
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
    primaryKey: any
  ): InstanceType<T> => {
    createCollection(store, entityClass);
    const currentCollection = getCollectionName(entityClass);
    return store.collections[currentCollection].values.get(
      primaryKey as string
    ) as InstanceType<T>;
  }
);

/**
 * Finds a single instance by value. Throws if there are too many or too few entries retrieved. Single case of
 * `findAllBy`
 *
 * @param store
 * @param entityClass
 * @param indexedProperty
 * @param value
 */
export const findOneBy = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    indexedProperty: keyof InstanceType<T>,
    value: any
  ): InstanceType<T> => {
    return getOnlyOne(findAllBy(store, entityClass, indexedProperty, value));
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
    findClause: (arg0: InstanceType<T>) => any = (entry: InstanceType<T>) =>
      entry
  ): InstanceType<T>[] => {
    createCollection(store, entityClass);
    const currentCollection = getCollectionName(entityClass);

    return Array.from(
      store.collections[currentCollection].values.values()
    ).filter(findClause);
  }
);

/**
 * Finds all entries in the store by a given value. Similar to findAll, but without dependence on a primary key.
 * Attempts to use indexes to find a particular value, falls back to non-indexed filter.
 *
 * @param store
 * @param entityClass
 * @param indexedProperty
 * @param value
 */
export const findAllBy = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    indexedProperty: OneOrMany<keyof InstanceType<T>>,
    value: OneOrMany<any>
  ): InstanceType<T>[] => {
    createCollection(store, entityClass);
    const currentCollectionName = getCollectionName(entityClass);
    const currentCollection = store.indicies[currentCollectionName];
    const indexedPropertyKey = getIndexKey(indexedProperty);
    // Fall back to non-indexed lookup
    if (!hasIn(currentCollection, indexedPropertyKey)) {
      logger.warn("Falling back to non-indexed filter for property");
      return findAll(store, entityClass, item => {
        const indexedPropertyValues = getPropertyValues(item, indexedProperty);
        return isEqual(indexedPropertyValues, value);
      });
    }

    return (currentCollection[indexedPropertyKey].values.get(
      getIndexKey(value)
    ) as PrimaryKey[])
      .map(primaryKey =>
        findOne(store, entityClass, primaryKey as keyof InstanceType<T>)
      )
      .filter(entity => !!entity);
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
    createCollection(store, entityClass);
    createCollection(store, joinClass);
    const entityCollectionName = getCollectionName(entityClass);
    const { values, primaryKeyPropertyName } = store.collections[
      entityCollectionName
    ];
    const entityCollection = Array.from(values.values()) as InstanceType<T>[];

    const childCollectionName = getCollectionName(joinClass);
    const childCollection = store.collections[childCollectionName];

    return flatMap(entityCollection, (entity: InstanceType<T>) => {
      const foreignKeyReference = store.foreignKeys[entityCollectionName];
      const currentPrimaryKeyValue = getIndexKey(
        entity[primaryKeyPropertyName as keyof typeof entity]
      );
      const joinRelationships: RelationshipEntry[] = Object.values(
        foreignKeyReference
      ).filter(({ type }) => type === joinClass);

      return flatMap(joinRelationships, ({ values }: RelationshipEntry) =>
        values[currentPrimaryKeyValue].map((key: string) => [
          entity,
          childCollection.values.get(key)
        ])
      );
    });
  }
);

/**
 * Truncates a given collection in the store and triggers any observables watching this particular collection.
 * This is essentially a very fast form of mass deletion.
 *
 * This does not automatically cascade to subsequent tables, since that's a fairly slow operation. This will
 * leave items in referenced tables. However, if the `cascade` option is included, then it will truncate *all*
 * tables that are referenced by this table, regardless of cascade options on the relationship.
 *
 * @export
 * @function
 * @param store
 * @param entityClass
 */
export const truncateCollection = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    options: TruncateOptions = { cascade: false }
  ) => {
    const currentCollectionName = getCollectionName(entityClass);
    // Trigger any observables watching the store for this collection
    store.collections[currentCollectionName].values.clear();
    store.indicies[currentCollectionName] = {};
    if (!options.cascade) {
      return;
    }
    Object.values(store.foreignKeys[currentCollectionName]).map(({ type }) => {
      truncateCollection(store, type as Constructor<{}>, options);
    });
  }
);

/**
 *
 */
export const createCollection = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
  ) => {
    const currentCollectionName = getCollectionName(entityClass);
    store.collections[currentCollectionName] =
      store.collections[currentCollectionName] || {
        primaryKeyPropertyName: null,
        values: new Map()
      };

    store.indicies[currentCollectionName] = store.indicies[currentCollectionName] || {};
    store.foreignKeys[currentCollectionName] = store.foreignKeys[currentCollectionName] || new Map();
  }
);

/**
 *
 */
export const createIndex = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    properties: OneOrMany<keyof InstanceType<T>>,
    isPrimaryKey: boolean = false
  ) => {
    const currentCollectionName = getCollectionName(entityClass);
    const indexKey = getIndexKey(properties);

    store.indicies[currentCollectionName] =
      store.indicies[currentCollectionName] || {};

    store.indicies[currentCollectionName][indexKey] = store.indicies[
      currentCollectionName
    ][indexKey] || {
      isPrimaryKey,
      propertyNames: [],
      values: new Map()
    };

    store.indicies[currentCollectionName][indexKey].propertyNames.push(
      properties
    );
  }
);

export const createForeignKey = action(
  <T extends Constructor<{}>, C extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    childClass: C,
    propertyName: keyof InstanceType<T>,
    options: CascadeOptions = {}
  ) => {
    store.foreignKeys[getCollectionName(entityClass)] = store.foreignKeys[getCollectionName(entityClass)] || new Map();
    store.foreignKeys[getCollectionName(entityClass)].set(propertyName, {
      options,
      type: childClass,
      values: {}
    })
  }
);
