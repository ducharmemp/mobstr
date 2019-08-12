import {
  createStore,
  addOne,
  removeOne,
  findAll,
  addAll,
  removeAll,
  findOne,
  truncateCollection,
} from "./store";
import { createCollectionTrigger, dropTrigger, dropAllTriggers } from './triggers';
import { primaryKey, relationship } from "./decorators";
import { notNull, notUndefined, unique, check } from './constraints';

/**
 * Intializes a store and provides helper methods bound to that store for convenience.
 * Note: calling this function multiple times will have no side effects, multiple stores will
 * be returned for use by the user.
 */
export default function initialize() {
  const store = createStore();
  return {
    store,
    // Decorators
    primaryKey,
    relationship: relationship.bind(null, store),
    // Store methods
    findAll: findAll.bind(null, store),
    findOne: findOne.bind(null, store),
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
    unique: unique.bind(null, store),
    notNull: notNull.bind(null, store),
    notUndefined: notUndefined.bind(null, store),
    check: check.bind(null, store),
  };
}
