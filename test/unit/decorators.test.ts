import { describe, it } from "mocha";
import { expect } from "chai";
import { v4 as uuid } from 'uuid';

import { indexed, primaryKey, relationship, notNull, notUndefined, unique } from "../../src/decorators";
import { createStore, addOne, findAll, truncateCollection } from "../../src/store";
import { IntegrityError } from "@src/errors";

describe("#decorators", (): void => {
  describe("#indexed", (): void => {
    it("should add an attribute to the __meta__.indicies", (): void => {
      const store = createStore();
      class Foo {
        @indexed(store)
        attrib: number = 0;
      }

      const f = new Foo();

      expect(f)
        .to.have.property("__meta__")
        .that.has.property("indicies")
        .and.includes("attrib");
    });
  });

  describe("#primaryKey", (): void => {
    it("should create an entry in the indicies of the store", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey(store)
        attrib: number = 0;
      }

      const f = new Foo();

      expect(store.indicies.Foo.attrib.isPrimaryKey).to.be.true;
      expect(store.indicies.Foo.attrib.propertyNames).to.eql('attrib');
    });
  });

  describe("#relationship", (): void => {
    it("should set a relationship to the __meta__.key", (): void => {
      const store = createStore();
      class Bar {
        @primaryKey(store)
        id: number = 0;
      }

      class Foo {
        @primaryKey(store)
        attrib: number = 0;

        @relationship(store, () => Bar)
        friends: Bar[] = [];
      }

      const f = new Foo();

      expect((f as any).__meta__.relationships)
        .to.have.property("friends")
        .that.has.property("type")
        .that.is.eql(Bar);
    });

    it("should allow an options parameter to allow cascades when the item is removed from the list", (): void => {
      const store = createStore();
      class Bar {
        @primaryKey(store)
        id: number = 0;
      }

      class Foo {
        @primaryKey(store)
        attrib: number = 0;

        @relationship(store, () => Bar, { deleteOnRemoval: true })
        friends: Bar[] = [];
      }

      const f = new Foo();

      expect((f as any).__meta__.relationships)
        .to.have.property("friends")
        .that.has.property("options").that.is.not.empty;
      addOne(store, f);
      f.friends.push(new Bar());
      expect(findAll(store, Bar)).to.have.length(1);
      f.friends.pop();
      expect(findAll(store, Bar)).to.have.length(0);
    });

    it("should allow a user to replace an entity in a relationship by index", (): void => {
      const store = createStore();
      class Bar {
        @primaryKey(store)
        id = uuid();
      }

      class Foo {
        @primaryKey(store)
        id = uuid();

        @relationship(store, () => Bar)
        friends: Bar[] = [];
      }

      const f = new Foo();
      const b = new Bar();
      f.friends.push(new Bar(), new Bar());
      f.friends[0] = b;
      expect(f.friends[0]).to.be.eql(b);
    });
  });

  describe('#notNull', (): void => {
    it('should check that a given column is not nullable', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        @notNull(store)
        name = null;
      }

      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
    });

    it('should check that a given column is not nullable if the user tries to set it on instance construction', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        @notNull(store)
        name = 5;
      }

      const f = new Foo();
      (f.name as any) = null;
      expect(() => addOne(store, f)).to.throw(IntegrityError);
    });
  });

  describe('#notUndefined', (): void => {
    it('should check that a given column is not undefine-able', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        @notUndefined(store)
        name = undefined;
      }

      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
    });
  });

  describe('#unique', (): void => {
    it('should check that a given column must have unique values', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        @unique(store)
        name = '1';
      }

      addOne(store, new Foo());
      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
    });

    it('should check that a given indexed column must have unique values', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey(store)
        id = uuid();

        @unique(store)
        @indexed(store)
        name = '1';
      }

      addOne(store, new Foo());
      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
    });
  });
});
