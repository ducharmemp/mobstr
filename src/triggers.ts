/**
 * @module triggers
 */
import {
  observe,
  Lambda,
  intercept,
  IObjectWillChange,
  IInterceptor,
  action,
  IObjectDidChange,
  IValueWillChange
} from "mobx";
import { createStore } from "./store";
import { getMeta, getNextId, ensureCollection } from "./utils";
import {
  Constructor,
  TriggerQueryEvent,
  TriggerExecutionStrategy,
  TriggerOptions
} from "./types";

/**
 * Runs a given trigger, filtering out event types that aren't relevant to the current trigger
 *
 * @export
 * @function
 * @param trigger
 * @param eventTypes
 * @param change
 */
export const executeTrigger = action(
  (
    trigger: any,
    eventTypes: Set<TriggerQueryEvent>,
    change: IObjectWillChange | IObjectDidChange
  ): any | null => {
    if (
      !eventTypes.has(TriggerQueryEvent.All) &&
      !eventTypes.has(change.type as TriggerQueryEvent)
    ) {
      // To ignore the value, we need to return the change by itself, otherwise we issue a ROLLBACK
      return change;
    }
    return trigger(change);
  }
);

/**
 * Wraps a trigger for execution
 *
 * @export
 * @function
 * @param target
 * @param trigger
 * @param eventTypes
 * @param triggerStrategy
 */
export const wrapTrigger = action(
  <T extends Constructor<{}>>(
    target: Map<PropertyKey, any>,
    trigger: Lambda | IInterceptor<IValueWillChange<InstanceType<T>>>,
    eventTypes: Set<TriggerQueryEvent>,
    triggerStrategy: TriggerExecutionStrategy
  ) => {
    const wrapping =
      triggerStrategy === TriggerExecutionStrategy.Intercept
        ? intercept
        : observe;
    return wrapping(target, executeTrigger.bind(null, trigger, eventTypes));
  }
);

/**
 * Creates a trigger scoped to a particular collection. This is a low-level primitive to basically
 * map over mobx's intercept and observe for a particular collection
 *
 * @example
 * ```typescript
 *
 * class Foo {
 *  @primaryKey
 *  id = ''
 *
 *  name = 'fooName'
 * }
 *
 * createCollectionTrigger(Foo, (change) => { console.log('Foo changed', change) });
 * addOne(new Foo());
 * ```
 *
 * @export
 * @function
 * @param store
 * @param entityClass
 * @param trigger
 * @param options
 */
export const createCollectionTrigger = action(
  <T extends Constructor<{}>>(
    store: ReturnType<typeof createStore>,
    entityClass: T,
    trigger: IInterceptor<IValueWillChange<InstanceType<T>>> | Lambda,
    options: TriggerOptions = {}
  ) => {
    ensureCollection(store, entityClass);
    const currentMeta = getMeta(entityClass);
    const triggerId = getNextId(store);
    const {
      eventTypes = new Set([TriggerQueryEvent.All]),
      triggerExecutionStrategy = TriggerExecutionStrategy.Observe
    } = options;
    store.triggers.set(
      triggerId,
      wrapTrigger(
        store.collections[currentMeta.collectionName as string],
        trigger,
        eventTypes,
        triggerExecutionStrategy
      )
    );
    return triggerId;
  }
);

/**
 * Drops a single trigger from the store
 *
 * @export
 * @function
 * @param store
 * @param triggerId
 */
export const dropTrigger = action(
  (store: ReturnType<typeof createStore>, triggerId: number) => {
    // Call the disposer
    (store.triggers.get(triggerId) as Function)();
    store.triggers.delete(triggerId);
  }
);

/**
 * Drops all triggers from the store. Note: constraints are implemented
 * as triggers, so this function will drop all constraints as well
 *
 * @export
 * @function
 * @param store
 */
export const dropAllTriggers = action(
  (store: ReturnType<typeof createStore>) => {
    Array.from(store.triggers.keys()).forEach(key => dropTrigger(store, key));
  }
);
