/**
 * @module decorators
 */
import { observable, action } from "mobx";
import {
  createStore,
  addOne,
  removeOne,
  createIndex,
  createCollection,
  createForeignKey
} from "./store";
import { CascadeOptions, Constructor } from "./types";
import {
  checkNotNull,
  checkNotUndefined,
  checkUnique,
  check
} from "./constraints";
import { getCollectionName } from "./utils";

/**
 * Defines a primary key for the current target. This primary key will be used for uniquely
 * identifying the object in the store, as well as identifying the entity in any
 * relationships. Each model *must* have a primary key for identification purposes.
 *
 * Note: currently the primary key *must* be a single value. This is due to limitations
 * in the internal storage mechanism of ES6 Maps.
 *
 * @example
 *
 * ```typescript
 * class FooModel {
 *  @primaryKey
 *  id: string = uuid();
 * }
 * ```
 *
 * @export
 * @function
 * @param {*} target
 * @param {PropertyKey} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function primaryKey(store: ReturnType<typeof createStore>) {
  return action(function<T extends InstanceType<Constructor<{}>>>(
    target: T,
    propertyKey: keyof T
  ) {
    createCollection(store, target.constructor as Constructor<T>);
    store.collections[
      getCollectionName(target.constructor as Constructor<T>)
    ].primaryKeyPropertyName = propertyKey;
    checkUnique(store, target.constructor as Constructor<T>, propertyKey);
    createIndex(store, target.constructor as Constructor<T>, propertyKey, true);
  });
}

/**
 * Creates an indexed value in the store. This will be used for fast lookups when scanning
 * using findAllBy and findOneBy
 *
 * @export
 * @function
 * @param {*} target
 * @param {PropertyKey} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function indexed(store: ReturnType<typeof createStore>) {
  return action(function<T extends InstanceType<Constructor<{}>>>(
    target: T,
    propertyKey: keyof T
  ) {
    createCollection(store, target.constructor as Constructor<T>);
    createIndex(store, target.constructor as Constructor<T>, propertyKey);
  });
}

/**
 * Describes a relationship to another model. The related model will be referenced
 * by its primary key for accessing purposes.
 *
 * When assigning to the relationship, all items are added to the store. When removing from the list,
 * via pop or splice, all items removed are *not necessarily* removed from the store unless otherwise
 * specified in the relationship options.
 *
 * Values can also be replaced in lists via indexing. While any new values will be added to the store,
 * replaced values will *not* be removed from the store unless otherwise specified in the relationship
 * options, similar to the approach for splice and pop.
 *
 * @example
 * ```typescript
 *
 * class BarModel {
 *  @primaryKey
 *  id: string = uuid();
 * }
 *
 * class FooModel {
 *  @primaryKey
 *  id: string = uuid();
 *
 *  @relationship(type => BarModel)
 *  friends: Bar[];
 * }
 *
 * const f = new FooModel();
 * f.friends.push(new BarModel());
 * ```
 * @export
 * @function
 * @param {ReturnType<typeof createStore>} store
 * @param {*} type
 * @param {*} [options={}]
 * @returns
 */
export function relationship<K>(
  store: ReturnType<typeof createStore>,
  type: (...args: any[]) => Constructor<K>,
  options: CascadeOptions = {}
) {
  return action(function<T extends InstanceType<Constructor<{}>>>(
    target: T,
    propertyKey: keyof T
  ): any {
    createCollection(store, target.constructor as Constructor<T>);
    createCollection(store, type().constructor as Constructor<K>);
    createForeignKey(
      store,
      target.constructor as Constructor<T>,
      type.constructor as Constructor<K>,
      propertyKey
    );

    return observable({
      get(this: T): ReturnType<typeof type>[] {
        const currentCollectionName = getCollectionName(
          target.constructor as Constructor<T>
        );
        const { primaryKeyPropertyName } = store.collections[
          currentCollectionName
        ];
        const currentPrimaryKeyValue = (this[
          primaryKeyPropertyName as keyof T
        ] as unknown) as PropertyKey;
        const currentRelationship = store.foreignKeys[
          currentCollectionName
        ].get(primaryKeyPropertyName);

        const propertyCollectionName = getCollectionName(
          currentRelationship!.type
        );
        const propertyCollection =
          store.collections[propertyCollectionName as string];

        const returnRelationship = observable(
          currentRelationship!.values[currentPrimaryKeyValue as string]
            .map(currentPrimaryKey =>
              propertyCollection.values.get(currentPrimaryKey)
            )
            .filter(value => !!value)
        );

        // Set up the observation function to watch and see if the user modifies the list after we grant
        // the borrow
        returnRelationship.observe(changes => {
          if (changes.type === "splice") {
            changes.added.map(
              action((change: any) => {
                addOne(store, change);
                currentRelationship!.values[
                  currentPrimaryKeyValue as string
                ].push(change[primaryKeyPropertyName]);
              })
            );
            changes.removed.forEach((change: any) => {
              currentRelationship!.values[
                propertyKey as string
              ].replace(
                currentRelationship!.values[
                  currentPrimaryKeyValue as string
                ].filter(key => key !== change[primaryKeyPropertyName])
              );

              if (options.deleteOnRemoval === true) {
                removeOne(store, change);
              }
            });
          } else {
            addOne(store, changes.newValue);
            currentRelationship!.values[currentPrimaryKeyValue as string][
              changes.index
            ] = changes.newValue[propertyKey];
          }
        });

        return returnRelationship;
      },

      set(this: T, values: any[]) {
        const currentCollectionName = getCollectionName(
          target.constructor as Constructor<T>
        );
        const { primaryKeyPropertyName } = store.collections[
          currentCollectionName
        ];
        const currentPrimaryKeyValue = (this[
          primaryKeyPropertyName as keyof T
        ] as unknown) as PropertyKey;
        const currentRelationship = store.foreignKeys[
          currentCollectionName
        ].get(propertyKey)!.values[currentPrimaryKeyValue as string];
        values.map(value => addOne(store, value));
        currentRelationship.replace(
          observable.array(values.map(value => value[propertyKey]))
        );
      }
    });
  });
}

/**
 * Checks that a field will never receive `null` as a value
 *
 * @export
 * @param store
 */
export function notNull(store: ReturnType<typeof createStore>) {
  return action(function<T extends InstanceType<Constructor<{}>>>(
    target: T,
    propertyKey: keyof T
  ) {
    checkNotNull(store, target.constructor as Constructor<T>, propertyKey);
  });
}

/**
 * Checks that a field will never receive `undefined` as a value
 *
 * @export
 * @param store
 */
export function notUndefined<T>(store: ReturnType<typeof createStore>) {
  return action(function(target: any, propertyKey: PropertyKey) {
    checkNotUndefined(store, target.constructor, propertyKey);
  });
}

/**
 * Checks that the field has a unique value. Implies that an index will be created
 *
 * @export
 * @param store
 */
export function unique(store: ReturnType<typeof createStore>) {
  return action(function<T extends InstanceType<Constructor<{}>>>(
    target: T,
    propertyKey: keyof T
  ) {
    checkUnique(store, target.constructor as Constructor<T>, propertyKey);
    createIndex(store, target.constructor as Constructor<T>, propertyKey);
  });
}

/**
 * Defines a custom check function to be used while adding this object to the store.
 *
 * @export
 * @param store
 */
export function setCheck(
  store: ReturnType<typeof createStore>,
  checkConstraint: (...args: any[]) => boolean
) {
  return action(function<T extends InstanceType<Constructor<{}>>>(
    target: T,
    propertyKey: keyof T
  ) {
    check(
      store,
      target.constructor as Constructor<T>,
      propertyKey,
      checkConstraint
    );
  });
}
