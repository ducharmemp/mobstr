import { createStore } from "./store";
import { createCollectionTrigger, TriggerExecutionStrategy } from "./triggers";
import { Constructor } from "./types";

/**
 *
 *
 * @export
 */
export function check<T extends Constructor<{}>>(
  store: ReturnType<typeof createStore>,
  entityClass: T,
  propertyName: keyof InstanceType<T>
) {
  createCollectionTrigger(
    store,
    entityClass,
    change => {
      return change;
    },
    { triggerExecutionStrategy: TriggerExecutionStrategy.Intercept }
  );
}

/**
 *
 *
 * @export
 */
export function notNull(store: ReturnType<typeof createStore>) {}

/**
 *
 *
 * @export
 */
export function notUndefined(store: ReturnType<typeof createStore>) {}

/**
 *
 *
 * @export
 */
export function unique(store: ReturnType<typeof createStore>) {}

/**
 *
 *
 * @export
 */
export function exclude(store: ReturnType<typeof createStore>) {}
