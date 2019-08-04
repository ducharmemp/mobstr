import { observable } from 'mobx';
import { flatMap, chain, head, get } from 'lodash';

import { ensureMeta } from "./utils";

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

/**
 * 
 * @param store 
 * @param entity 
 */
export function add(store: ReturnType<typeof createStore>, entity: any) {
  ensureMeta(entity);
  const currentCollection = entity.__meta__.collectionName,
    currentKey = entity.__meta__.key.get();
  store.collections[currentCollection] = (
    store.collections[currentCollection]
    || new Map()
  );
  store.collections[currentCollection].set(
    entity[currentKey], entity
  );
}

/**
 * 
 * @param store 
 * @param entity 
 */
export function remove(store: ReturnType<typeof createStore>, entity: any) {
  ensureMeta(entity);
  const primaryKey = entity.__meta__.key.get(),
   currentCollection = entity.__meta__.collectionName;
  (
    store.collections[currentCollection]
    || new Map()
  ).delete(entity[primaryKey]);
}

/**
 * 
 * @param store 
 * @param entityClass 
 * @param findClause 
 */
export function find(
  store: ReturnType<typeof createStore>,
  entityClass,
  findClause = (entry) => entry,
) {
  ensureMeta(entityClass);
  const currentCollection = entityClass.__meta__.collectionName;
  return Array.from(
    (
      store.collections[currentCollection]
      || new Map()
    ).values()
  ).filter(findClause);
}

/**
 * Joins two collections based on their applicable relationships.
 *
 * @export
 * @param {ReturnType<typeof createStore>} store
 * @param {*} entityClass
 * @param {*} childClass
 * @returns
 */
// FIXME: This doesn't exactly work like I'd want it to
export function join(store: ReturnType<typeof createStore>, entityClass: any, childClass: any, onClause?) {
  const entityCollectionName = entityClass.__meta__.collectionName,
    entities = Array.from(store.collections[entityCollectionName].values()),
    entityRelationShips = entityClass.__meta__.relationships,

    childCollectionName = childClass.__meta__.collectionName,
    childCollection = store.collections[childCollectionName];

  return flatMap(entities, (entity) => {
    const children = chain(entityRelationShips)
      .values()
      .filter((relationship) => relationship.type === childClass)
      .flatMap((relationship) => relationship.keys)
      .value();
    const relationships = chain(entityRelationShips)
      .values()
      .filter((relationship) => console.log({relationship}) as any || relationship.type === childClass)
      .flatMap((relationship) => console.log(relationship.keys) as any || relationship.keys)
      .value();

      return relationships.map(
        (relationshipKey) => childCollection.get(relationshipKey)
      );
    })
      // .map((child) => [entity, child]);
}

