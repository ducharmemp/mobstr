import { createStore, add, remove, find } from './store';
import { primaryKey, relationship } from './decorators';

export function initialize() {
  const store = createStore();
  return {
    store,
    primaryKey,
    relationship,
    find: find.bind(null, store),
    add: add.bind(null, store),
    remove: remove.bind(null, store),
  }
}
