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
export type CollectionName = PropertyKey;
export type PrimaryKey = PropertyKey;
export type IndexValue = PropertyKey; // TODO: Should this support more complex types?
export type IndexKey = PropertyKey;
export type TriggerId = number;
export type OneOrMany<T> = T | T[];
export interface RelationshipEntry {
  type: Constructor<{}>;
  values: Record<PrimaryKey, IObservableArray<string>>;
  options: CascadeOptions;
}
export interface ShapeEntry {
  primaryKey: PropertyKey | null;
  indicies: OneOrMany<PropertyKey>[];
  foreignKeys: PropertyKey[];
}
export interface IndexEntry {
  isPrimaryKey: boolean;
  propertyNames: OneOrMany<IndexKey>[];
  values: Map<IndexKey, PrimaryKey[]>;
}
export interface CollectionEntry {
  primaryKeyPropertyName: PrimaryKey;
  values: Map<PrimaryKey, any>;
}

/**
 *
 */
export interface CascadeOptions {
  cascade?: boolean;
  deleteOnRemoval?: boolean;
}

export interface TruncateOptions {
  cascade?: boolean;
}

/**
 *
 */
export interface StoreOptions {
  disableConstraintChecks?: boolean;
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
export interface Store extends IObservableObject {
  options: StoreOptions;
  collections: Record<CollectionName, CollectionEntry>;
  indicies: Record<
    CollectionName,
    Record<IndexKey, IndexEntry>
  >;
  foreignKeys: Record<
    CollectionName,
    Map<PropertyKey, RelationshipEntry>
  >;
  triggers: Map<TriggerId, Lambda>;
  nextId: TriggerId;
}
