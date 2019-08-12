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
export function check<T extends Constructor<{}>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>,
  constraint: (arg0: InstanceType<T>[keyof InstanceType<T>]) => boolean,
  constraintOptions?: {}
) {
  createCollectionTrigger(
    store,
    entityClass,
    change => {
      const { newValue } = change;
      const propertyValue = getBoxedValueOrValue(newValue[propertyName]);
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
      // 
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
  constraintOptions?: {}
) {
  check(
    store,
    entityClass,
    propertyName,
    propertyValue => propertyValue !== null,
    constraintOptions
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
  constraintOptions?: {}
) {
  check(
    store,
    entityClass,
    propertyName,
    propertyValue => propertyValue !== undefined,
    constraintOptions
  );
}

/**
 * Creates a unique constraint on a field in a given object. This implies that
 * the field is also indexed
 *
 * @export
 */
export function unique<T extends Constructor<{}>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>,
  constraintOptions?: {}
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
    constraintOptions
  );
}

/**
 *
 *
 * @export
 */
export function exclude<T extends Constructor<{}>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>,
  constraintOptions?: {}
) {}
