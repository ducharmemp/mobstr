import { observable, action } from "mobx";
import { Meta } from "./types";
import { createStore } from "./store";

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
 * Ensures that the current target has a meta attribute attached, and ensures that
 * the meta is attached to the target itself and not its prototype
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
      enumerable: false,
      writable: false,
      configurable: true,
      value: metaAttribute
    });
  }
}

/**
 *
 *
 * @export
 * @param {*} target
 */
export function ensureConstructorMeta(target: any) {
  ensureMeta(target.constructor);
}

/**
 *
 *
 * @export
 * @param {*} target
 * @param {string} propertyKey
 * @param {() => any} type
 * @param {*} options
 */
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

export const getNextId = action((store: ReturnType<typeof createStore>) => {
  store.nextId += 1;
  return store.nextId;
});

/**
 *
 *
 * @export
 */
export const ensureCollection = action(
  (store: ReturnType<typeof createStore>, entityClass: any) => {
    const currentMeta = getMeta(entityClass);
    store.collections[currentMeta.collectionName as string] =
      store.collections[currentMeta.collectionName as string] || observable.map();
  }
);
