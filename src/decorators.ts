/**
 * @module decorators
 */
import { observable, action } from "mobx";
import { createStore, addOne } from "./store";
import {
  ensureMeta,
  ensureConstructorMeta,
  ensureRelationship,
  ensureCollection,
  getMeta,
  ensureIndicies
} from "./utils";
import { CascadeOptions } from "./types";
import {
  checkNotNull,
  checkNotUndefined,
  checkUnique,
  check
} from "./constraints";

/**
 * Defines a primary key for the current target. This primary key will be used for uniquely
 * identifying the object in the store, as well as identifying the entity in any
 * relationships. Each model *must* have a primary key for identification purposes.
 *
 * Note: currently the primary key *must* be a single value. This is due to limitations
 * in the internal storage mechanism of ES6 Maps.
 *
 * @example
 * class FooModel {
 *  @primaryKey
 *  id: string = uuid();
 * }
 *
 * @export
 * @function
 * @param {*} target
 * @param {PropertyKey} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function primaryKey(target: any, propertyKey: PropertyKey) {
  ensureMeta(target);
  ensureConstructorMeta(target);
  getMeta(target).indicies.push(propertyKey);
  getMeta(target).key.set(propertyKey);
}

/**
 * Creates an indexed value in the store. This will be used for fast lookups in the
 * case of specialized filters. Currently not implemented.
 *
 * @export
 * @function
 * @param {*} target
 * @param {PropertyKey} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function indexed(target: any, propertyKey: PropertyKey) {
  ensureMeta(target);
  ensureConstructorMeta(target);
  getMeta(target).indicies.push(propertyKey);
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
export function relationship(
  store: ReturnType<typeof createStore>,
  type: any,
  options: CascadeOptions = {}
) {
  return function(target: any, propertyKey: PropertyKey): any {
    ensureMeta(target);
    ensureConstructorMeta(target);
    ensureCollection(store, target);
    ensureMeta(type());
    ensureRelationship(target, propertyKey as string, type, options);

    return observable({
      get(): ReturnType<typeof type>[] {
        ensureMeta(this);
        ensureRelationship(this, propertyKey as string, type, options);

        const currentRelationship = getMeta(this).relationships[
          propertyKey as string
        ];
        const propertyCollectionName = getMeta(currentRelationship.type)
          .collectionName;
        const propertyCollection =
          store.collections[propertyCollectionName as string];

        const returnRelationship = observable(
          currentRelationship.keys
            .map(currentPrimaryKey => propertyCollection.get(currentPrimaryKey))
            .filter(value => !!value)
        );

        // Set up the observation function to watch and see if the user modifies the list after we grant
        // the borrow
        returnRelationship.observe(changes => {
          if (changes.type === "splice") {
            changes.added.map(
              action((change: any) => {
                addOne(store, change);
                currentRelationship.keys.push(
                  change[getMeta(change).key.get() as string]
                );
              })
            );
            changes.removed.forEach(change => {
              currentRelationship.keys.replace(
                currentRelationship.keys.filter(
                  key => key !== change[getMeta(change).key.get() as string]
                )
              );
              // FIXME: This would be the proper place to track cascades on the relationship.
              // removeOne(store, change);
            });
          } else {
            addOne(store, changes.newValue);
            currentRelationship.keys[changes.index] =
              changes.newValue[getMeta(changes.newValue).key.get() as string];
          }
        });

        return returnRelationship;
      },

      set(values: any[]) {
        ensureMeta(this);
        ensureConstructorMeta(this);
        ensureCollection(store, this);
        ensureRelationship(this, propertyKey as string, type, options);

        const currentRelationship = getMeta(this).relationships[
          propertyKey as string
        ];
        values.map(value => addOne(store, value));
        currentRelationship.keys = observable.array(
          values.map(value => value[getMeta(value).key.get() as string])
        );
      }
    });
  };
}

/**
 * Checks that a field will never receive `null` as a value
 *
 * @param store
 */
export function notNull<T>(store: ReturnType<typeof createStore>) {
  return function(target: any, propertyKey: PropertyKey) {
    ensureMeta(target);
    ensureConstructorMeta(target);
    ensureCollection(store, target.constructor);
    ensureIndicies(store, target.constructor);
    checkNotNull(store, target.constructor, propertyKey);
  };
}

/**
 * Checks that a field will never receive `undefined` as a value
 *
 * @param store
 */
export function notUndefined<T>(store: ReturnType<typeof createStore>) {
  return function(target: any, propertyKey: PropertyKey) {
    ensureMeta(target);
    ensureConstructorMeta(target);
    ensureCollection(store, target.constructor);
    ensureIndicies(store, target.constructor);
    checkNotUndefined(store, target.constructor, propertyKey);
  };
}

/**
 * Checks that the field has a unique value. Implies that an index will be created
 *
 * @param store
 */
export function unique<T>(store: ReturnType<typeof createStore>) {
  return function(target: any, propertyKey: PropertyKey) {
    indexed(target, propertyKey); // FIXME: Shouldn't this have already been done in checkUnique?
    checkUnique(store, target.constructor, propertyKey);
  };
}

/**
 * Defines a custom check function to be used while adding this object to the store.
 *
 * @param store
 */
export function setCheck<T>(
  store: ReturnType<typeof createStore>,
  checkConstraint: (...args: (keyof T)[]) => boolean
) {
  return function(target: any, propertyKey: PropertyKey) {
    ensureMeta(target);
    ensureConstructorMeta(target);
    ensureCollection(store, target.constructor);
    ensureIndicies(store, target.constructor);
    check(store, target.constructor, propertyKey, checkConstraint);
  };
}
