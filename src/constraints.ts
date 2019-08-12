import { createStore } from "./store";
import {
  createCollectionTrigger,
  TriggerExecutionStrategy,
  TriggerQueryEvent
} from "./triggers";
import { Constructor } from "./types";
import { getBoxedValueOrValue, getMeta, ensureCollection, ensureIndicies } from "./utils";
import { IntegrityError } from "./errors";
import { indexed } from './decorators';

/**
 *
 *
 * @export
 */
export function check<K, T extends Constructor<K>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>,
  constraint: (arg0: InstanceType<T>[keyof InstanceType<T>]) => boolean,
) {
  createCollectionTrigger(
    store,
    entityClass,
    change => {
      const { newValue, object } = change;
      const propertyValue = getBoxedValueOrValue(newValue[propertyName]);
      const oldValue = getBoxedValueOrValue(object[propertyName]);
      if (!constraint(propertyValue)) {
        throw new IntegrityError(
          `Check constraint failed on field ${entityClass.name}.${propertyName}`
        );
      }
      return change;
    },
    {
      triggerExecutionStrategy: TriggerExecutionStrategy.Intercept,
      // Have to do update here due to "update" events being fired on the same observable
      // i.e. a Map.set on the same key actually fires an "update" event instead of an "add"
      eventTypes: new Set([TriggerQueryEvent.Insert, TriggerQueryEvent.Update])
    }
  );
}

/**
 *
 *
 * @export
 */
export function notNull<T extends Constructor<{}>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>,
) {
  check(
    store,
    entityClass,
    propertyName,
    propertyValue => propertyValue !== null,
  );
}

/**
 *
 *
 * @export
 */
export function notUndefined<T extends Constructor<{}>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>,
) {
  check(
    store,
    entityClass,
    propertyName,
    propertyValue => propertyValue !== undefined,
  );
}

/**
 * Creates a unique constraint on a field in a given object. This implies that
 * the field will be indexed.
 *
 * @export
 */
export function unique<T extends Constructor<{}>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>,
) {
  const currentCollection = getMeta(entityClass).collectionName;
  indexed(entityClass, propertyName as string);

  ensureCollection(store, entityClass);
  ensureIndicies(store, entityClass);
  
  check(
    store,
    entityClass,
    propertyName,
    propertyValue => {
      return !store.indicies[currentCollection as string].has(
        (propertyValue as unknown) as string
      );
    },
  );
}
