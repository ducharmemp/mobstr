import {
    createStore, add, remove, find,
} from './store';
import { primaryKey, relationship } from './decorators';

/**
 * Intializes a store and provides helper methods bound to that store for convenience.
 */
export default function initialize() {
    const store = createStore();
    return {
        store,
        primaryKey,
        relationship: relationship.bind(null, store),
        find: find.bind(null, store),
        add: add.bind(null, store),
        remove: remove.bind(null, store),
    };
}
