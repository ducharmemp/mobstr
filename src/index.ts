import {
    createStore, addOne, removeOne, findAll, addAll, removeAll, findOne,
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
        findAll: findAll.bind(null, store),
        findOne: findOne.bind(null, store),
        addOne: addOne.bind(null, store),
        addAll: addAll.bind(null, store),
        removeOne: removeOne.bind(null, store),
        removeAll: removeAll.bind(null, store),
    };
}
