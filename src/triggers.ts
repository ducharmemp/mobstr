import {
  observe,
  Lambda,
  intercept,
  IObjectWillChange,
  IInterceptor,
  action,
  IObjectDidChange
} from "mobx";
import { createStore } from "./store";
import { getMeta, getNextId, ensureCollection } from "./utils";

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
  eventType?: TriggerQueryEvent;
  triggerExecutionStrategy?: TriggerExecutionStrategy;
}

/**
 * 
 */
export const executeTrigger = action(
  (
    trigger: any,
    eventType: TriggerQueryEvent,
    change: IObjectWillChange | IObjectDidChange
  ): any | null => {
    if (eventType !== TriggerQueryEvent.All && eventType !== change.type) {
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
    eventType: TriggerQueryEvent,
    triggerStrategy: TriggerExecutionStrategy
  ) => {
    const wrapping =
      triggerStrategy === TriggerExecutionStrategy.Intercept
        ? intercept
        : observe;
    return wrapping(target, executeTrigger.bind(null, trigger, eventType));
  }
);

/**
 * 
 */
export const createCollectionTrigger = action(
  (
    store: ReturnType<typeof createStore>,
    entityClass: any,
    trigger: IInterceptor<IObjectWillChange> | Lambda,
    options: TriggerOptions = {}
  ) => {
    ensureCollection(store, entityClass);
    const currentMeta = getMeta(entityClass);
    const triggerId = getNextId(store);
    const {
      eventType = TriggerQueryEvent.All,
      triggerExecutionStrategy = TriggerExecutionStrategy.Observe
    } = options;
    store.triggers.set(
      triggerId,
      wrapTrigger(
        store.collections[currentMeta.collectionName as string],
        trigger,
        eventType,
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
