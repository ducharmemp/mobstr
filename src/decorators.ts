import 'reflect-metadata';

import { v4 as uuid } from 'uuid';
import { observable, extendObservable } from 'mobx';
import { createStore, add } from './store';

export function ensureMeta(target: any) {
  target.constructor.__meta__ = target.constructor.__meta__ || observable({
    collectionName: target.constructor.name,
    indexes: [],
    keys: null,
  });
  target.__meta__ = target.__meta__ || observable({
    collectionName: target.constructor.name,
    name: uuid(),
    indexes: [],
    keys: null,
    relationships: {} as Record<string | symbol, { type: string; keys: string[], options: Record<string, any> }>
  });
}

export function primaryKey(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
  ensureMeta(target);
  extendObservable(
    target,
    {
      get [propertyKey]() {
        return target.__meta__.keys;
      },
      set [propertyKey](value) {
        target.__meta__.keys = value;
      }
    }
  )
}

export function indexed(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
  ensureMeta(target);
  target.__meta__.indexes.push(propertyKey);
}

export function relationship(store: ReturnType<typeof createStore>, type, options = {}) {
  return function(target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
    ensureMeta(target);
    target.__meta__.relationships[propertyKey] = {
      type: type(),
      keys: [],
      options
    };

    extendObservable(
      target,
      {
        get [propertyKey]() {
          const currentRelationship = target.__meta__.relationships[propertyKey],
            propertyCollectionName = currentRelationship.type.__meta__.collectionName,
            propertyCollection = store.collections[propertyCollectionName];
          return currentRelationship.keys.map(
            (primaryKey) => console.log(primaryKey) as any || propertyCollection.get(primaryKey)
          ).filter(value => !!value);
        },

        set [propertyKey](values) {
          const currentRelationship = target.__meta__.relationships[propertyKey];
          values.map((value) => add(store, value));
          currentRelationship.keys = values.map((value) => value.__meta__.keys);
        }
      }
    )
  }
}
