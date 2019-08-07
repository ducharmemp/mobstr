import { observable, action } from 'mobx';
import { flatMap } from 'lodash';

import { Meta } from './meta';
import { ensureMeta } from './utils';

/**
 *
 *
 * @export
 * @returns
 */
export const createStore = action(() => observable({
    collections: {} as Record<string | symbol | number, Map<string | symbol | number, any>>,
    primaryKeys: new Map(),
    indicies: new Map(),
}));

/**
 *
 * @param store
 * @param entity
 */
export const addOne = action((store: ReturnType<typeof createStore>, entity: any) => {
    ensureMeta(entity);
    const currentCollection = entity.__meta__.collectionName;
    const currentKey = entity.__meta__.key.get();
    store.collections[currentCollection] = (
        store.collections[currentCollection]
    || observable.map()
    );
    store.collections[currentCollection].set(
        entity[currentKey], entity,
    );
});

/**
 *
 * @param store
 * @param entity
 */
export const addAll = action((store: ReturnType<typeof createStore>, entities: any[]) => {
  entities.forEach((entity) => {
    ensureMeta(entity);
    const currentCollection = entity.__meta__.collectionName;
    const currentKey = entity.__meta__.key.get();
    store.collections[currentCollection] = (
        store.collections[currentCollection]
    || observable.map()
    );
    store.collections[currentCollection].set(
        entity[currentKey], entity,
    );
  });
});

/**
 *
 * @param store
 * @param entity
 */
export const removeOne = action((store: ReturnType<typeof createStore>, entity: any) => {
    ensureMeta(entity);
    const primaryKey = entity.__meta__.key.get();
    const currentCollection = entity.__meta__.collectionName;
    (
        store.collections[currentCollection]
    || observable.map()
    ).delete(entity[primaryKey]);
});

/**
 * 
 * @param store
 * @param entities
 */
export const removeAll = action((store: ReturnType<typeof createStore>, entities: any[]) => {
  entities.forEach((entity) => {
    ensureMeta(entity);
    const primaryKey = entity.__meta__.key.get();
    const currentCollection = entity.__meta__.collectionName;
    (
        store.collections[currentCollection]
    || observable.map()
    ).delete(entity[primaryKey]);
  });
});

/**
 *
 * @param store
 * @param entityClass
 * @param findClause
 */
export const findAll = action((
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
        ).values(),
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
export const join = action(
    (store: ReturnType<typeof createStore>, entityClass: any, joinClass: any) => {
        ensureMeta(entityClass);
        ensureMeta(joinClass);
        const entityCollectionName = entityClass.__meta__.collectionName;
        const entityCollection = Array.from(store.collections[entityCollectionName].values());

        const childCollectionName = joinClass.__meta__.collectionName;
        const childCollection = store.collections[childCollectionName];


        return flatMap(entityCollection, ((entity: any) => {
            const joinRelationships = Object.values(
                (entity as Meta).__meta__.relationships,
            ).filter(({ type }) => type === joinClass);

            return flatMap(joinRelationships, (
                ({ keys }) => keys.map(key => [entity, childCollection.get(key)])));
        }));
    },
);
