import { observable } from 'mobx';
import { flatMap, chain } from 'lodash';

import { ensureMeta } from './decorators';

/**
 *
 *
 * @export
 * @returns
 */
export function createStore() {
  return observable({
    collections: {} as Record<string, Map<string, any>>,
    primaryKeys: new Map(),
    indexes: new Map(),
  });
}

export function add(store: ReturnType<typeof createStore>, entity: any | any[]) {
  ensureMeta(entity);
  store.collections[entity.__meta__.collectionName] = (
    store.collections[entity.__meta__.keys]
    || new Map()
  );
  store.collections[entity.__meta__.collectionName].set(entity.__meta__.keys, entity);
}

export function remove(store: ReturnType<typeof createStore>, entity: any) {
  ensureMeta(entity);
  (
    store.collections[entity.__meta__.collectionName]
    || new Map()
  ).delete(entity.__meta__.keys);
}

export function find(
  store: ReturnType<typeof createStore>,
  entity,
  findClause = (entry) => entity.__meta__.keys === entry.__meta__.keys,
) {
  return Array.from(store.collections[entity.__meta__.collectionName].values()).filter(findClause);
}

export function join(store: ReturnType<typeof createStore>, entityClass: any, childClass: any) {
  const entities = Array.from(store.collections[entityClass.__meta__.collectionName].values()),
    children = Array.from(store.collections[childClass.__meta__.collectionName].values());

  return flatMap(entities, (entity) => {
    return children
      .filter((child) => {
        const relationships = chain(entity.__meta__.relationships)
          .values()
          .filter((relationship) => relationship.type === childClass)
          .flatMap((relationship) => relationship.keys)
          .value();

        return relationships.find(
          (value) => child.__meta__.keys === value
        );
      })
      .map((child) => [entity, child]);
  });
}

