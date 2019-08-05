import 'reflect-metadata';

import { observable, extendObservable, remove, action } from 'mobx';
import { createStore, add } from './store';
import { ensureMeta } from './utils';

/**
 * Defines a primary key for the current target. This primary key will be used for uniquely identifying the object in the store,
 * as well as identifying the entity in any relationships. Each model *must* have a primary key for identification purposes.
 *
 * Note: currently the primary key *must* be a single value. This is due to limitations in the internal storage mechanism of ES6 Maps.
 * 
 * @example
 * class FooModel {
 *  @primaryKey
 *  id: string = uuid();
 * }
 * 
 * @export
 * @param {*} target
 * @param {(string | symbol)} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function primaryKey(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
  ensureMeta(target);
  target.__meta__.indexes.push(propertyKey);
  target.__meta__.key.set(propertyKey);
}

/**
 * Creates an indexed value in the store. This will be used for fast lookups in the case of specialized filters. Currently not implemented.
 *
 * @export
 * @param {*} target
 * @param {(string | symbol)} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function indexed(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
  ensureMeta(target);
  target.__meta__.indexes.push(propertyKey);
}

/**
 * Describes a relationship to another model. The related model will be referenced by its primary key for accessing purposes.
 * 
 * @example
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
 *
 * @export
 * @param {ReturnType<typeof createStore>} store
 * @param {*} type
 * @param {*} [options={}]
 * @returns
 */
export function relationship(store: ReturnType<typeof createStore>, type, options = {}) {
  return function(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
    ensureMeta(target);
    target.__meta__.relationships[propertyKey] = {
      type: type(),
      keys: [],
      options
    };

    const decorator = {
      get [propertyKey](): ReturnType<typeof type>[] {
        const currentRelationship = target.__meta__.relationships[propertyKey],
          propertyCollectionName = currentRelationship.type.__meta__.collectionName,
          propertyCollection = store.collections[propertyCollectionName];

        const returnRelationship = observable(
          currentRelationship.keys.map(
            (primaryKey) => propertyCollection.get(primaryKey)
          ).filter(value => !!value)
        );

        returnRelationship.observe(
          (changes) => {
            changes.added.map(action(change => {
              currentRelationship.keys.push(change[change.__meta__.key.get()])
              add(store, change)
            }));
            changes.removed.map(change => remove(store, change));
          }
        )

        return returnRelationship;
      },

      set [propertyKey](values) {
        const currentRelationship = target.__meta__.relationships[propertyKey];
        values.map((value) => add(store, value));
        currentRelationship.keys = values.map(
          (value) => value[value.__meta__.key]
        );
      }
    }

    const extended = extendObservable(
      target,
      decorator
    );

    return extended;
  }
}
