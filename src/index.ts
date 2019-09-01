/**
 * @module mobstr
 */
import {
  createStore,
  addOne,
  removeOne,
  findAll,
  addAll,
  removeAll,
  findOne,
  truncateCollection,
  findAllBy,
  findOneBy
} from "./store";
import {
  createCollectionTrigger,
  dropTrigger,
  dropAllTriggers,
} from "./triggers";
import {
  primaryKey,
  relationship,
  notNull,
  notUndefined,
  setCheck,
  unique,
  indexed
} from "./decorators";
import {
  checkNotNull,
  checkNotUndefined,
  checkUnique,
  check,
  dropAllConstraints,
  dropConstraint,
} from "./constraints";

/**
 * Intializes a store and provides helper methods bound to that store for convenience.
 * Note: calling this function multiple times will have no side effects, multiple stores will
 * be returned for use by the user.
 */
export function initializeStore() {
  const store = createStore();
  return {
    store,
    // Decorators
    primaryKey,
    indexed,
    relationship: relationship.bind(null, store),
    notNull: notNull(store),
    notUndefined: notUndefined(store),
    unique: unique(store),
    setCheck: setCheck.bind(null, store),
    // Store methods
    findAll: findAll.bind(null, store),
    findOne: findOne.bind(null, store),
    findAllBy: findAllBy.bind(null, store),
    findOneBy: findOneBy.bind(null, store),
    addOne: addOne.bind(null, store),
    addAll: addAll.bind(null, store),
    removeOne: removeOne.bind(null, store),
    removeAll: removeAll.bind(null, store),
    truncateCollection: truncateCollection.bind(null, store),
    // Trigger methods
    dropTrigger: dropTrigger.bind(null, store),
    dropAllTriggers: dropAllTriggers.bind(null, store),
    createCollectionTrigger: createCollectionTrigger.bind(null, store),
    // Constraints
    checkUnique: checkUnique.bind(null, store),
    checkNotNull: checkNotNull.bind(null, store),
    checkNotUndefined: checkNotUndefined.bind(null, store),
    check: check.bind(null, store),
    dropConstraint: dropConstraint.bind(null, store),
    dropAllConstraints: dropAllConstraints.bind(null, store),
  };
}

export { CascadeOptions, Meta, Store, TriggerOptions, TriggerExecutionStrategy, TriggerQueryEvent } from './types';
export { IntegrityError, MultipleResultsFound, NoResultsFound } from './errors';
