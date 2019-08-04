import { describe, it } from "mocha";
import { expect } from 'chai';
import { v4 as uuid } from 'uuid';

import { createStore, add, remove, join, find } from '@src/store';
import { primaryKey, relationship } from '@src/decorators';

describe('Integration', () => {
  it('should allow construction of a collection class', () => {
    const store = createStore();

    class Bar {}

    class Foo {
      @primaryKey
      id: number = uuid();

      @relationship(store, type => Bar)
      friends: Bar = [];
    }

    add(store, new Foo());
  });

  it('should allow removal of a collection class', () => {
    const store = createStore();

    class Bar {}

    class Foo {
      @primaryKey
      id: number = uuid();

      @relationship(store, type => Bar)
      friends: Bar = [];
    }

    const f = new Foo()
    add(store, f);
    remove(store, f);
  });

  it('should allow join of a collection class to another collection class', () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: number = uuid();
    }

    class Foo {
      @primaryKey
      id: number = uuid();

      @relationship(store, type => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo(),
      b = new Bar(),
      b2 = new Bar();
    add(store, f);
    add(store, b);
    add(store, b2);
    f.friends = [b];
    expect(join(store, Foo, Bar)).to.have.length(2);
  });

  it('should allow a collection class to access a relationship', () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: number = uuid();
    }

    class Foo {
      @primaryKey
      id: number = uuid();

      @relationship(store, type => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo(),
      b = new Bar();
    add(store, f);
    add(store, b);
    f.friends = [b];
    expect(f.friends).to.have.length(1);
  });

  it('should allow the user to delete a collection', () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: number = uuid();
    }

    class Foo {
      @primaryKey
      id: number = uuid();

      @relationship(store, type => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo(),
      b = new Bar();
    add(store, f);
    expect(find(store, f)).to.have.length(1);
    remove(store, f);
    expect(find(store, f)).to.have.length(0);
  });
})
