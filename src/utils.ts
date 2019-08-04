import { v4 as uuid } from 'uuid';
import { observable } from 'mobx';

/**
 * 
 *
 * @export
 * @param {*} target
 */
export function ensureMeta(target: any) {
  target.constructor.__meta__ = target.constructor.__meta__ || observable({
    collectionName: target.constructor.name,
    relationships: {} as Record<string | symbol, {
      type: string;
      keys: string[];
      options: Record<string, any>;
    }>,
    indexes: [],
  });
  target.__meta__ = target.__meta__ || observable({
    collectionName: target.constructor.name,
    name: uuid(),
    indexes: [],
    key: observable.box(null),
    relationships: {} as Record<string | symbol, {
      type: string;
      keys: string[];
      options: Record<string, any>;
    }>
  });
}
