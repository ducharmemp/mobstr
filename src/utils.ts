/**
 * @module utils
 */
import { observable, action, IObservableValue } from "mobx";
import get from 'lodash.get';
import isObject from 'lodash.isobject';
import isArray from 'lodash.isarray';
import hash from "object-hash";

import { OneOrMany, Constructor } from "./types";
import { createStore } from "./store";
import { NoResultsFound, MultipleResultsFound } from "./errors";


export const getNextId = action((store: ReturnType<typeof createStore>) => {
  store.nextId += 1;
  return store.nextId;
});

/**
 * Unboxes a value from a mobx `observable.box`
 * @param value
 */
export function getBoxedValueOrValue<T>(value: IObservableValue<T> | T): T {
  // Magic to either get the boxed value or return the original value. We need to make sure to bind the this property
  return get(value, "get", () => value).bind(value)();
}

/**
 * Gets only a single value from a list of values. Throws if there aren't any items present or if there
 * are too many values present
 * @param values
 */
export function getOnlyOne<T>(values: T[]): T {
  if (values.length === 0) {
    throw new NoResultsFound(`No results found for query`);
  }
  if (values.length > 1) {
    throw new MultipleResultsFound(`Multiple results found for query`);
  }
  return values[0];
}

/**
 * Gets the key to use for indexing purposes. Primitives return as themselves,
 * more complex objects return as string hashes.
 *
 * @param value
 */
export function getIndexKey<T>(value: T): PropertyKey {
  if (!isObject(value)) {
    return value as unknown as PropertyKey;
  }
  return hash(value);
}

/**
 * Determines if an invariant condition has been met and throws an error if
 * the precondition was falsy. Includes NODE_ENV checks for dead code elimination.
 */
export function invariant(condition: () => boolean, message: string) {
  if (process.env.NODE_ENV !== "production" && !condition()) {
    throw new Error(message);
  }
}

/**
 * 
 * @param value 
 */
export function castArray<T>(value: T | T[]): T[] {
  return isArray(value) ? value : [value];
}

/**
 * 
 * @param item 
 * @param values 
 */
export function getPropertyValues<T>(item: T, values: OneOrMany<keyof T>) {
  return isArray(values) ? values.map(valueKey => item[valueKey]) : item[values];
}

export function getCollectionName<T extends Constructor<{}>>(entityClass: T): string {
  return entityClass.name;
}
