import { describe, it } from "mocha";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { computed } from "mobx";

import {
  createStore,
  addOne,
  removeOne,
  join,
  findAll,
  findOne
} from "../src/store";
import { primaryKey, relationship } from "../src/decorators";

describe("#integration", () => {
  it("should allow construction of a collection class", () => {
    const store = createStore();

    class Bar {}

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar = [];
    }

    addOne(store, new Foo());
  });

  it("should allow removal of a collection class", () => {
    const store = createStore();

    class Bar {}

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar = [];
    }

    const f = new Foo();
    addOne(store, f);
    removeOne(store, f);
  });

  it("should allow join of a collection class to another collection class", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo();
    const f2 = new Foo();
    const b = new Bar();
    const b2 = new Bar();
    const b3 = new Bar();

    addOne(store, f);
    addOne(store, f2);
    addOne(store, b);
    addOne(store, b2);
    f.friends = [b, b3];
    f2.friends.push(b2);
    expect(join(store, Foo, Bar)).to.have.length(3);
  });

  it("should allow a collection class to access a relationship", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo();
    const b = new Bar();
    addOne(store, f);
    addOne(store, b);
    f.friends = [b];
    expect(f.friends).to.have.length(1);
  });

  it("should allow the user to delete an item from a collection", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo();
    const b = new Bar();
    addOne(store, f);
    // This works because we have meta attributes on all classes. Having one instance means you can get *all* instances
    expect(findAll(store, f)).to.have.length(1);
    removeOne(store, f);
    expect(findAll(store, f)).to.have.length(0);
  });

  it("should allow the user to find a single item by key from a collection", () => {
    const store = createStore();

    class Foo {
      @primaryKey
      id: string = uuid();
    }

    const f = new Foo();
    addOne(store, f);
    expect(findOne(store, Foo, f.id)).to.have.property("id", f.id);
  });

  it("should have relationships that react to item deletions", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo();
    const b = new Bar();

    addOne(store, f);
    f.friends.push(b);
    expect(f.friends).to.have.lengthOf(1);
    removeOne(store, b);
    expect(f.friends).to.have.lengthOf(0);
  });

  it("should not cascade delete children by default", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo();
    const b = new Bar();

    addOne(store, f);
    f.friends.push(b);
    expect(f.friends).to.have.lengthOf(1);
    removeOne(store, f);
    expect(findAll(store, Bar)).to.have.lengthOf(1);
  });

  it("should allow multiple relationships", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Baz {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];

      @relationship(store, (type: any) => Baz)
      enemies: Baz[] = [];
    }

    const f = new Foo();
    const bar = new Bar();
    const baz = new Baz();

    addOne(store, f);
    f.friends.push(bar);
    f.enemies.push(baz);
    expect(f.friends).to.have.lengthOf(1);
    expect(f.enemies).to.have.lengthOf(1);
    expect(f.enemies[0]).to.have.property("id", baz.id);
  });

  it("should allow multiple entities", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo();
    const f2 = new Foo();
    const b = new Bar();

    addOne(store, f);
    addOne(store, f2);
    f.friends.push(b);
    expect(f.friends).to.have.lengthOf(1);
    expect(f2.friends).to.have.lengthOf(0);
    f2.friends.push(b);
    expect(f2.friends).to.have.lengthOf(1);
    expect(f.friends).to.have.lengthOf(1);
  });

  it("should allow popping of entity from a relationship", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];
    }

    const f = new Foo();
    const f2 = new Foo();
    const b = new Bar();

    addOne(store, f);
    addOne(store, f2);
    f.friends.push(b);
    expect(f.friends).to.have.lengthOf(1);
    f.friends.pop();
    expect(f.friends).to.have.lengthOf(0);
  });

  it("should allow computed property values on models", () => {
    const store = createStore();

    class Bar {
      @primaryKey
      id: string = uuid();
    }

    class Foo {
      @primaryKey
      id: string = uuid();

      @relationship(store, (type: any) => Bar)
      friends: Bar[] = [];

      @computed
      get friendIds() {
        return this.friends.map(friend => friend.id);
      }
    }

    const f = new Foo();
    const b = new Bar();

    addOne(store, f);
    f.friends.push(b);
    expect(f.friendIds).to.have.lengthOf(1);
  });
});
