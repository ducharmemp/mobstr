import { createStore, add, remove } from './store';
import { primaryKey, relationship } from './decorators';

export function initialize() {
  const store = createStore();
  return {
    store,
    primaryKey,
    relationship,
    add: add.bind(null, store),
    remove: remove.bind(null, store),
  }
}
