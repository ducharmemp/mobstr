import { observable, remove, action } from 'mobx';
import { createStore, addOne } from './store';
import { Meta } from './meta';
import { ensureMeta, ensureRelationship } from './utils';

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
 * @param {*} target
 * @param {(string | symbol)} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function primaryKey(target: any, propertyKey: string | symbol) {
    ensureMeta(target);
    target.__meta__.indexes.push(propertyKey);
    target.__meta__.key.set(propertyKey);
}

/**
 * Creates an indexed value in the store. This will be used for fast lookups in the
 * case of specialized filters. Currently not implemented.
 *
 * @export
 * @param {*} target
 * @param {(string | symbol)} propertyKey
 * @param {PropertyDescriptor} [descriptor]
 */
export function indexed(target: any, propertyKey: string | symbol) {
    ensureMeta(target);
    target.__meta__.indexes.push(propertyKey);
}

/**
 * Describes a relationship to another model. The related model will be referenced
 * by its primary key for accessing purposes.
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
export function relationship(
    store: ReturnType<typeof createStore>,
    type: any,
    options = {},
) {
    return function (target: any, propertyKey: string | symbol): any {
        ensureMeta(target);
        ensureMeta(type());
        ensureRelationship(target, propertyKey as string, type, options);

        return observable({
            get(): ReturnType<typeof type>[] {
                ensureMeta(this);
                ensureRelationship(this, propertyKey as string, type, options);

                const currentRelationship = (
                    (this as unknown as Meta).__meta__.relationships[propertyKey as string]
                );
                const propertyCollectionName = (
                    (currentRelationship.type as Meta).__meta__.collectionName
                );
                const propertyCollection = store.collections[propertyCollectionName as string];

                const returnRelationship = observable(
                    currentRelationship.keys.map(
                        currentPrimaryKey => propertyCollection.get(currentPrimaryKey),
                    ).filter(value => !!value),
                );

                returnRelationship.observe(
                    (changes) => {
                        if (changes.type === 'splice') {
                            changes.added.map(action((change: any) => {
                                currentRelationship.keys.push(
                                    change[change.__meta__.key.get()],
                                );
                                addOne(store, change);
                            }));
                            changes.removed.forEach((change) => {
                                currentRelationship.keys.replace(
                                    currentRelationship.keys.filter(
                                        key => key !== change[change.__meta__.key.get()],
                                    ),
                                );
                                // FIXME: This would be the proper place to track cascades
                                remove(store, change);
                            });
                        } else {
                            // TODO: ???? What to do with IArrayChange?
                        }
                    },
                );

                return returnRelationship;
            },

            set(values: any[]) {
                ensureMeta(this);
                ensureRelationship(this, propertyKey as string, type, options);

                const currentRelationship = (
                    (this as unknown as Meta).__meta__.relationships[propertyKey as string]
                );
                values.map(value => addOne(store, value));
                currentRelationship.keys = observable.array(values.map(
                    value => value[value.__meta__.key],
                ));
            },
        });
    };
}
