import { observable, action, toJS } from 'mobx';
import { flatMap, chain } from 'lodash';

import { Meta } from './meta';
import { ensureMeta } from "./utils";

/**
 *
 *
 * @export
 * @returns
 */
export const createStore = action(() => {
  return observable({
    collections: {} as Record<string | symbol | number, Map<string | symbol | number, any>>,
    primaryKeys: new Map(),
    indexes: new Map(),
  });
});

/**
 * 
 * @param store 
 * @param entity 
 */
export const add = action((store: ReturnType<typeof createStore>, entity: any) => {
  ensureMeta(entity);
  const currentCollection = entity.__meta__.collectionName,
    currentKey = entity.__meta__.key.get();
  store.collections[currentCollection] = (
    store.collections[currentCollection]
    || observable.map()
  );
  store.collections[currentCollection].set(
    entity[currentKey], entity
  );
});

/**
 * 
 * @param store 
 * @param entity 
 */
export const remove = action((store: ReturnType<typeof createStore>, entity: any) => {
  ensureMeta(entity);
  const primaryKey = entity.__meta__.key.get(),
   currentCollection = entity.__meta__.collectionName;
  (
    store.collections[currentCollection]
    || observable.map()
  ).delete(entity[primaryKey]);
});

/**
 * 
 * @param store 
 * @param entityClass 
 * @param findClause 
 */
export const find = action((
  store: ReturnType<typeof createStore>,
  entityClass: any,
  findClause: (arg0: any) => any = (entry: any) => entry,
) => {
  ensureMeta(entityClass);
  const currentCollection = (entityClass as Meta).__meta__.collectionName;
  return Array.from(
    (
      store.collections[currentCollection as string]
      || observable.map()
    ).values()
  ).filter(findClause);
});

export const findOne = action((
  store: ReturnType<typeof createStore>,
  entityClass: any,
  primaryKey: ReturnType<Meta['__meta__']['key']['get']>,
) => {
  ensureMeta(entityClass);
  const currentCollection = (entityClass as Meta).__meta__.collectionName;
  return (
    store.collections[currentCollection as string]
    || observable.map()
  ).get(primaryKey as string);
});


/**
 * Joins two collections based on their applicable relationships.
 *
 * @export
 * @param {ReturnType<typeof createStore>} store
 * @param {*} entityClass
 * @param {*} childClass
 * @returns
 */
export const join = action((store: ReturnType<typeof createStore>, entityClass: any, joinClass: any) => {
  ensureMeta(entityClass);
  ensureMeta(joinClass);
  const entityCollectionName = entityClass.__meta__.collectionName,
    entityCollection = Array.from(store.collections[entityCollectionName].values()),

    childCollectionName = joinClass.__meta__.collectionName,
    childCollection = store.collections[childCollectionName];
    

  return flatMap(entityCollection, ((entity) => {
    const joinRelationships = Object.values(
      (entity as Meta).__meta__.relationships
    ).filter(({ type }) => type === joinClass);

    return flatMap(joinRelationships, (({ keys }) => {
      return keys.map((key) => [entity, childCollection.get(key)]);
    }));
  }));
});
