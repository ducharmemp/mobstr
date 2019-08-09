import { range } from 'lodash';
import { v4 as uuid } from 'uuid';

import { primaryKey } from '../src/decorators';
import { addAll, createStore, dropCollection, removeAll } from '../src/store';

describe('#performance', (): void => {
  it('should be performant in adding 10k amounts of items to a collection', (): void => {
    const store = createStore()

    class Foo {
      @primaryKey
      id = uuid();
    }
    addAll(store, range(10000).map(() => new Foo()))
  });

  it('should be performant in adding and then removing 10k items to a collection', (): void => {
    const store = createStore();

    class Foo {
      @primaryKey
      id = uuid();
    }
    const foos = range(10000).map(() => new Foo());
    addAll(store, foos);
    removeAll(store, foos);
  });

  it('should be performant in adding 10k items and then dropping a collection', (): void => {
    const store = createStore();

    class Foo {
      @primaryKey
      id = uuid();
    }
    const foos = range(10000).map(() => new Foo());
    addAll(store, foos);
    dropCollection(store, Foo);
  });
});
