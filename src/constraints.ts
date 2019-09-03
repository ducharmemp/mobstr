/**
 * @module constraints
 */
import { createStore, createIndex } from "./store";
import {
  createCollectionTrigger,
  dropTrigger,
  dropAllTriggers
} from "./triggers";
import {
  Constructor,
  TriggerExecutionStrategy,
  TriggerQueryEvent
} from "./types";
import {
  getBoxedValueOrValue,
  getIndexKey,
  castArray,
  getCollectionName
} from "./utils";
import { IntegrityError } from "./errors";
import { action } from "mobx";

/**
 * Creates a CHECK constraint against a collection in the store. CHECK constraints
 * can be against multiple columns of the row, or a single column in the row
 *
 * @export
 * @param store
 * @param entityClass
 * @param propertyNames The name(s) of the columns to check
 * @param constraint
 * @returns {number} The ID of the trigger, for reference when deleting
 */
export const check = action(
  <K, T extends Constructor<K>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    propertyNames: (keyof InstanceType<T>)[] | (keyof InstanceType<T>),
    constraint: (...args: (InstanceType<T>[keyof InstanceType<T>])[]) => boolean
  ): number => {
    const arrayedPropertyNames = castArray(propertyNames);

    return createCollectionTrigger(
      store,
      entityClass,
      change => {
        const { newValue } = change;
        const {
          options: { disableConstraintChecks = false }
        } = store;
        const propertyValues = arrayedPropertyNames.map(propertyName =>
          getBoxedValueOrValue(newValue[propertyName])
        );
        if (disableConstraintChecks) {
          return change;
        }

        if (!constraint(...propertyValues)) {
          throw new IntegrityError(
            `Check constraint failed on ${
              entityClass.name
            } field(s): ${arrayedPropertyNames.join(
              ", "
            )} with values ${propertyValues.join(", ")}`
          );
        }
        return change;
      },
      {
        triggerExecutionStrategy: TriggerExecutionStrategy.Intercept,
        // Have to do update here due to "update" events being fired on the same observable
        // i.e. a Map.set on the same key actually fires an "update" event instead of an "add"
        eventTypes: new Set([
          TriggerQueryEvent.Insert,
          TriggerQueryEvent.Update
        ])
      }
    );
  }
);

/**
 * Ensures that a given column in a row is not nullable. This constraint runs on every update
 * to the collection (i.e. every time something is added to the collection)
 *
 * @export
 * @param store
 * @param entityClass
 * @param propertyName
 * @returns {number} The ID of the trigger, for reference when deleting
 */
export const checkNotNull = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    propertyName: keyof InstanceType<T>
  ): number => {
    return check(
      store,
      entityClass,
      propertyName,
      propertyValue => propertyValue !== null
    );
  }
);

/**
 * Ensures that a given property is not undefined. This constraint runs on every update
 * to the collection (i.e. every time something is added to the collection)
 *
 * @example
 *
 * ```typescript
 * class Foo {
 *
 * }
 * notNull(Foo);
 * ```
 *
 * @export
 * @param store
 * @param entityClass
 * @param propertyName
 * @returns {number} The ID of the trigger, for reference when deleting
 */
export const checkNotUndefined = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    propertyName: keyof InstanceType<T>
  ): number => {
    return check(
      store,
      entityClass,
      propertyName,
      propertyValue => propertyValue !== undefined
    );
  }
);

/**
 * Creates a unique constraint on a field in a given object. This implies that
 * the field will be indexed.
 *
 * @export
 * @param store
 * @param entityClass
 * @param propertyName
 * @returns {number} The ID of the trigger, for reference when deleting
 */
export const checkUnique = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    propertyName: keyof InstanceType<T>
  ): number => {
    const currentCollection = getCollectionName(entityClass);
    createIndex(store, entityClass, propertyName);

    return check(store, entityClass, propertyName, propertyValue => {
      return !store.indicies[currentCollection][propertyName].values.has(
        getIndexKey(propertyValue)
      );
    });
  }
);

/**
 * Syntactic sugar functions over dropping a given constraint from the store.
 * Since constraints are triggers, this will delete the underlying trigger from the store
 */
export const dropConstraint = dropTrigger;

/**
 * Syntactic sugar functions over dropping all constraint from the store.
 * Since constraints are triggers, this will delete all underlying triggers from the store
 */
export const dropAllConstraints = dropAllTriggers;
