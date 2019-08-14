/**
 * @module types
 */
import {
  IObservableValue,
  IObservableArray,
  IObservableObject,
  Lambda
} from "mobx";

/**
 * @private
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 *
 */
export interface CascadeOptions {
  cascade?: boolean;
}

/**
 * Describes the order of execution for triggers.
 *
 * Equivalent to the following SQL:
 *   - Intercept `CREATE TRIGGER test BEFORE ...`, `CREATE TRIGGER test INSTEAD OF ...`
 *   - Observe `CREATE TRIGGER test AFTER ...`
 *
 * @export
 * @enum {number}
 */
export enum TriggerExecutionStrategy {
  Intercept, // Before event, allows rewrite
  Observe // After event, disallows rewrite
}

/**
 * Describes the event for the trigger to listen on. Corresponds to:
 * - Insert
 * - Delete
 * - Update
 *
 * And a wildcard `All`
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

/**
 * The trigger listener options. Controls the order of execution (before/after the event), as well
 * as the specific event type (add, delete)
 */
export interface TriggerOptions {
  eventTypes?: Set<TriggerQueryEvent>;
  triggerExecutionStrategy?: TriggerExecutionStrategy;
}

/**
 *
 */
export interface Meta {
  __meta__: {
    key: IObservableValue<PropertyKey | null>;

    collectionName: PropertyKey;
    relationships: Record<
      PropertyKey,
      {
        type: any;
        keys: IObservableArray<string>;
        options: CascadeOptions;
      }
    >;
    indicies: IObservableArray<PropertyKey>;
  };
}

/**
 *
 */
export interface Store extends IObservableObject {
  collections: Record<PropertyKey, Map<PropertyKey, any>>;
  primaryKeys: Map<string, any>;
  indicies: Record<
    PropertyKey, // Name of collection
    Record<
      PropertyKey, // Name of property
      Map<
        PropertyKey, // Value of property
        PropertyKey // Primary Key
      >
    >
  >;
  triggers: Map<number, Lambda>;
  nextId: number;
}
