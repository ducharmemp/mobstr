import 'reflect-metadata';

import { v4 as uuid } from 'uuid';
import { observable, extendObservable, decorate } from 'mobx';
import { createStore, add } from './store';

/**
 *
 *
 * @export
 * @param {*} target
 */
export function ensureMeta(target: any) {
  target.constructor.__meta__ = target.constructor.__meta__ || observable({
    collectionName: target.constructor.name,
    relationships: {} as Record<string | symbol, { type: string; keys: string[], options: Record<string, any> }>,
    indexes: [],
  });
  target.__meta__ = target.__meta__ || observable({
    collectionName: target.constructor.name,
    name: uuid(),
    indexes: [],
    key: observable.box(null),
    relationships: {} as Record<string | symbol, { type: string; keys: string[], options: Record<string, any> }>
  });
}

/**
 *
 *
 * @export
 * @param {*} target
 * @param {(string | symbol)} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function primaryKey(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
  ensureMeta(target);
  extendObservable(
    target,
    {
      propertyKey,
    }
  );
  target.__meta__.indexes.push(propertyKey);
  target.__meta__.key.set(propertyKey);
}

/**
 *
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
 *
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

    decorate(
      target,
      {
        get [propertyKey]() {
          const currentRelationship = target.__meta__.relationships[propertyKey],
            propertyCollectionName = currentRelationship.type.__meta__.collectionName,
            propertyCollection = store.collections[propertyCollectionName];

          const returnRelationship = observable(
            currentRelationship.keys.map(
              (primaryKey) => propertyCollection.get(primaryKey)
            ).filter(value => !!value)
          );

          return returnRelationship;
        },

        set [propertyKey](values) {
          const currentRelationship = target.__meta__.relationships[propertyKey];
          values.map((value) => add(store, value));
          console.log("SET")
          currentRelationship.keys = values.map(
            (value) => value[value.__meta__.key]
          );
        }
      }
    );
  }
}
