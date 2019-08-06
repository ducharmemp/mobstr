import { v4 as uuid } from 'uuid';
import { observable } from 'mobx';
import { Meta } from './meta';

/**
 * 
 *
 * @export
 * @param {*} target
 */
export function ensureMeta(target: any) {
  if (!target.hasOwnProperty('__meta__')) {
    (target as Meta).__meta__ = observable({
      collectionName: target.name || target.constructor.name,
      indexes: [],
      key: observable.box(null),
      // Spread the values already present in the prototype
      ...target.__meta__ || {},
      relationships: {} as Record<string | symbol, {
        type: string;
        keys: string[];
        options: Record<string, any>;
      }>
    }) as any;
  }
}

export function ensureRelationship(target: any, propertyKey: string, type: any, options: any) {
  (target as unknown as Meta).__meta__.relationships[propertyKey] = (
    (target as unknown as Meta).__meta__.relationships[propertyKey]
    || observable({
      type: type(),
      keys: observable.array([]),
      options,
    })
  );
}
