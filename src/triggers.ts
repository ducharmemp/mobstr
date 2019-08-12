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
import { Constructor } from "./types";

/**
 *
 *
 * @export
 * @enum {number}
 */
export enum TriggerExecutionStrategy {
  Intercept, // Before event, allows rewrite
  Observe // After event, disallows rewrite
}

/**
 *
 *
 * @export
 * @enum {string}
 */
export enum TriggerQueryEvent {
  Insert = "add",
  Delete = "delete",
  Update = "update",
  // Truncate = "truncate",
  All = "all"
}

export interface TriggerOptions {
  eventTypes?: Set<TriggerQueryEvent>;
  triggerExecutionStrategy?: TriggerExecutionStrategy;
}

/**
 *
 */
export const executeTrigger = action(
  (
    trigger: any,
    eventTypes: Set<TriggerQueryEvent>,
    change: IObjectWillChange | IObjectDidChange
  ): any | null => {
    if (!eventTypes.has(TriggerQueryEvent.All) && !eventTypes.has(change.type as TriggerQueryEvent)) {
      return;
    }
    return trigger(change);
  }
);

/**
 *
 */
export const wrapTrigger = action(
  (
    target: any,
    trigger: any,
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
 *
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
 *
 */
export const dropTrigger = action(
  (store: ReturnType<typeof createStore>, triggerId: number) => {
    // Call the disposer
    (store.triggers.get(triggerId) as Function)();
    store.triggers.delete(triggerId);
  }
);

export const dropAllTriggers = action(
  (store: ReturnType<typeof createStore>) => {
    Array.from(store.triggers.keys()).forEach(key => dropTrigger(store, key));
  }
);
