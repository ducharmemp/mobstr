/**
 * @module utils
 */
import { observable, action, IObservableValue } from "mobx";
import { get, isObject } from "lodash";
import hash from 'object-hash';

import { Meta } from "./types";
import { createStore } from "./store";
import { NoResultsFound, MultipleResultsFound } from "./errors";

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
    const metaAttribute: Meta["__meta__"] = {
      collectionName: target.name || target.constructor.name,
      indicies: observable.array([]),
      key: observable.box(null),
      // Spread the values already present in the prototype, we want to maintain the constructor name
      ...(getMeta(target) || {}),
      relationships: {}
    };

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
      store.collections[currentMeta.collectionName as string] ||
      observable.map();
  }
);

/**
 *
 *
 * @export
 */
export const ensureIndicies = action(
  (store: ReturnType<typeof createStore>, entityClass: any) => {
    const currentMeta = getMeta(entityClass);
    store.indicies[currentMeta.collectionName as string] =
      store.indicies[currentMeta.collectionName as string] || {};
    // Create all of the property indicies but only if they already exist
    currentMeta.indicies.forEach(indexName => {
      store.indicies[currentMeta.collectionName as string][
        indexName as string
      ] =
        store.indicies[currentMeta.collectionName as string][
          indexName as string
        ] || observable.map();
    });
  }
);

/**
 * 
 * @param value 
 */
export function getBoxedValueOrValue<T>(value: IObservableValue<T> | T): T {
  // Magic to either get the boxed value or return the original value. We need to make sure to bind the this property
  return get(value, "get", () => value).bind(value)();
}

/**
 * 
 * @param values 
 */
export function getOnlyOne<T>(values: T[]): T {
  if (values.length === 0) { throw new NoResultsFound(`No results found for query`); }
  if (values.length > 1) { throw new MultipleResultsFound(`Multiple results found for query`); }
  return values[0];
}

export function getIndexKey<T>(value: T): PropertyKey {
  if (!isObject(value)) { return value as unknown as PropertyKey; }
  return hash(value);
}
