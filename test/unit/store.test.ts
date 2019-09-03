import { v4 as uuid } from "uuid";
import { describe, it } from "mocha";
import { expect } from "chai";
import range from "lodash.range";

import {
  addAll,
  removeAll,
  findAll,
  createStore,
  removeOne,
  findOne,
  truncateCollection,
  findOneBy,
  addOne,
  removeOneBy,
  findAllBy,
  removeAllBy,
  createIndex,
} from "../../src/store";
import { primaryKey, relationship, unique, indexed } from "../../src/decorators";
import { NoResultsFound } from "../../src/errors";

describe("#store", (): void => {
  describe("#addAll", (): void => {
    it("should allow users to add multiple values to the store at once", (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();
      }

      addAll(store, range(5).map(() => new Foo()));
      expect(store)
        .to.have.property("collections")
        .that.has.property("Foo")
        .that.has.lengthOf(5);
    });
  });

  describe("#findAll", (): void => {
    it("should allow users to find multiple values to the store at once by a specific query", (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        name = "test";
      }

      addAll(store, range(5).map(() => new Foo()));
      const f = new Foo();
      f.name = "test2";
      addAll(store, [f]);
      // This name lies, TS things it's a typeof Foo rather than a Foo. Need to fix the generic types.
      expect(
        findAll(store, Foo, entity => entity.name === "test")
      ).to.have.lengthOf(5);
      expect(
        findAll(store, Foo, entity => entity.name === "test2")
      ).to.have.lengthOf(1);
    });

    it("should find an empty list if there are no entries in the store", (): void => {
      class Foo {}
      const store = createStore();
      expect(findAll(store, Foo)).to.be.empty;
    });
  });

  describe("#removeAll", (): void => {
    it("should allow users to remove multiple values to the store at once", (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();
      }

      const foos = range(5).map(() => new Foo());
      addAll(store, foos);
      expect(store)
        .to.have.property("collections")
        .that.has.property("Foo")
        .that.has.lengthOf(5);
      removeAll(store, foos);
      expect(store)
        .to.have.property("collections")
        .that.has.property("Foo")
        .that.has.lengthOf(0);
    });
  });

  describe("#removeOne", (): void => {
    it("should cascade delete any relationships with cascade=true", (): void => {
      const store = createStore();
      class Bar {
        @primaryKey(store)
        id = uuid();
      }
      class Baz {
        @primaryKey(store)
        id = uuid();

        @relationship(store, () => Bar)
        enemies: Bar[] = [];
      }
      class Foo {
        @relationship(store, () => Bar, { cascade: true })
        friends: Bar[] = [];
      }

      const foo = new Foo();
      const bar = new Bar();
      const baz = new Baz();
      foo.friends.push(bar);
      baz.enemies.push(bar);
      expect(baz.enemies).to.have.lengthOf(1);
      removeOne(store, foo);
      expect(baz.enemies).to.have.lengthOf(0);
    });
  });

  describe("#findOne", (): void => {
    it("should not find anything when querying an object not in the store", (): void => {
      class Foo {}
      const store = createStore();
      expect(findOne(store, Foo, "")).to.be.undefined;
    });
  });

  describe('#findOneBy', (): void => {
    it('should find a class by an indexed value', () => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        @indexed(store)
        name = 'test';
      }

      const f = new Foo();
      addOne(store, f);
      expect(findOneBy(store, Foo, 'name', 'test')).to.be.eql(f);
    });

    it('should find a class by a non-indexed value', () => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        name = 'test';
      }

      const f = new Foo();
      addOne(store, f);
      expect(findOneBy(store, Foo, 'name', 'test')).to.be.eql(f);
    });
  });

  describe("#truncateCollection", (): void => {
    it('should delete all entries in a collection', (): void => {
      const store = createStore();
      class Foo {
        @primaryKey(store)
        id = uuid();
      }

      addAll(store, range(20).map(() => new Foo()));
      expect(findAll(store, Foo)).to.have.lengthOf(20);
      truncateCollection(store, Foo);
      expect(findAll(store, Foo)).to.have.lengthOf(0);
    });

    it('should truncate all entries when there is a constraint on a field', (): void => {
      const store = createStore();
      class Foo {
        @unique(store)
        @primaryKey(store)
        id = uuid();
      }

      addAll(store, range(20).map(() => new Foo()));
      expect(findAll(store, Foo)).to.have.lengthOf(20);
      truncateCollection(store, Foo);
      expect(findAll(store, Foo)).to.have.lengthOf(0);
    })

    it('should clear all entries in the collection map and index', (): void => {
      const store = createStore();
      class Foo {
        @primaryKey(store)
        id = uuid();
      }

      addAll(store, range(20).map(() => new Foo()));
      expect(findAll(store, Foo)).to.have.lengthOf(20);
      truncateCollection(store, Foo);
      expect(store.collections['Foo'].values.size).to.be.eql(0);
      expect(store.indicies['Foo']).to.be.empty;
    });

    it('should delete all related entries when the parent collection is truncated', (): void => {
      const store = createStore();
      class Bar {
        @primaryKey(store)
        id = uuid();
      }

      class Foo {
        @primaryKey(store)
        id = uuid();

        @relationship(store, () => Bar, { cascade: true })
        friends: Bar[] = [];

        constructor() {
          this.friends.push(new Bar(), new Bar(), new Bar());
        }
      }

      const foos = range(20).map(() => new Foo());
      addAll(store, foos);
      expect(findAll(store, Foo)).to.have.lengthOf(20);
      expect(findAll(store, Bar)).to.have.lengthOf(20 * 3);
      truncateCollection(store, Foo, { cascade: true });
      expect(findAll(store, Bar)).to.have.lengthOf(0);
      expect(findAll(store, Foo)).to.have.lengthOf(0);
    });
  });

  describe("#removeOneBy", (): void => {
    it("should remove an entity with a specific property value", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey(store)
        id = uuid();

        name = 'bob';
      }

      addOne(store, new Foo());
      removeOneBy(store, Foo, 'name', 'bob');
      expect(findAll(store, Foo)).to.have.length(0);
    });

    it("should remove any item by an indexed value", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey(store)
        id = uuid();

        @indexed(store)
        name = 'bob';
      }

      addOne(store, new Foo());
      removeOneBy(store, Foo, 'name', 'bob');
      expect(findAllBy(store, Foo, 'name', 'bob')).to.have.length(0);
    });

    it("should throw an exception if no entities are found that match a value", (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        @indexed(store)
        name = 'bob';
      }

      expect(() => findOneBy(store, Foo, 'name', 'bob')).to.throw(NoResultsFound)
    });
  });

  describe("#removeAllBy", (): void => {
   it("should remove all entities that match a specific value", (): void => {
    const store = createStore();

    class Foo {
      @primaryKey(store)
      id = uuid();

      name = 'bob';
    }

    addAll(store, [new Foo(), new Foo(), new Foo()]);
    removeAllBy(store, Foo, 'name', 'bob');
    expect(findAll(store, Foo)).to.have.length(0);
   });

   it("should remove all entities that match a specific indexed value", (): void => {
    const store = createStore();

    class Foo {
      @primaryKey(store)
      id = uuid();

      @indexed(store)
      name = 'bob';
    }

    addAll(store, [new Foo(), new Foo(), new Foo()]);
    removeAllBy(store, Foo, 'name', 'bob');
    expect(findAll(store, Foo)).to.have.length(0);
   });
  });

  describe("#createIndex", (): void => {
    it("should create an index on a given table", (): void => {

    });

    it('should create an index on a given table for many properties', (): void => {
      const store = createStore();
      class Foo {
        @primaryKey(store)
        id = uuid();

        name = 'bob';

        age = 42;
      }

      createIndex(store, Foo, ['name', 'age']);
      addOne(store, new Foo());
      expect(findAllBy(store, Foo, ['name', 'age'], ['bob', 42])).to.have.length(1);
    });
  })
});
