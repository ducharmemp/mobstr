import { observable } from "mobx";
import { Meta } from "./meta";

/**
 *
 *
 * @export
 * @param {unknown} target
 * @returns {Meta['__meta__']}
 */
export function getMeta(target: unknown): Meta["__meta__"] {
  return (target as Meta).__meta__;
}

/**
 *
 *
 * @export
 * @param {*} target
 */
export function ensureMeta(target: any) {
  if (!Object.prototype.hasOwnProperty.call(target, "__meta__")) {
    const metaAttribute = {
      collectionName: target.name || target.constructor.name,
      indicies: observable.array([]),
      key: observable.box(null),
      // Spread the values already present in the prototype, we want to maintain the constructor name
      ...(getMeta(target) || {}),
      relationships: {} as Record<
        string | symbol,
        {
          type: string;
          keys: string[];
          options: Record<string, any>;
        }
      >
    } as Meta["__meta__"];

    Object.defineProperty(target, "__meta__", {
      enumerable: true,
      writable: false,
      configurable: true,
      value: metaAttribute
    });
  }
}

export function ensureRelationship(
  target: any,
  propertyKey: string,
  type: () => any,
  options: any
) {
  getMeta(target).relationships[propertyKey] = getMeta(target).relationships[
    propertyKey
  ] || {
    type: type(),
    keys: observable.array([]),
    options
  };
}
