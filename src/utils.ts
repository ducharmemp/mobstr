import { observable } from 'mobx';
import { Meta } from './meta';

/**
 *
 *
 * @export
 * @param {*} target
 */
export function ensureMeta(target: any) {
    if (!Object.prototype.hasOwnProperty.call(target, '__meta__')) {
        (target as Meta).__meta__ = {
            collectionName: target.name || target.constructor.name,
            indicies: observable.array([]),
            key: observable.box(null),
            // Spread the values already present in the prototype, we want to maintain the constructor name
            ...target.__meta__ || {},
            relationships: {} as Record<string | symbol, {
                type: string;
                keys: string[];
                options: Record<string, any>;
            }>,
        } as Meta['__meta__'];
    }
}

export function ensureRelationship(target: any, propertyKey: string, type: () => any, options: any) {
    (target as unknown as Meta).__meta__.relationships[propertyKey] = (
        (target as unknown as Meta).__meta__.relationships[propertyKey]
    || {
        type: type(),
        keys: observable.array([]),
        options,
    }
    );
}
