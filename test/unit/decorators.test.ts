import { describe, it } from "mocha";
import { expect } from "chai";
import { v4 as uuid } from 'uuid';

import { indexed, primaryKey, relationship, notNull, notUndefined, unique } from "../../src/decorators";
import { Meta } from "../../src/types";
import { createStore, addOne } from "../../src/store";
import { IntegrityError } from "@src/errors";

describe("#decorators", (): void => {
  describe("#indexed", (): void => {
    it("should add an attribute to the __meta__.indicies", (): void => {
      class Foo {
        @indexed
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
    it("should set an attribute to the __meta__.key", (): void => {
      class Foo {
        @primaryKey
        attrib: number = 0;
      }

      const f = new Foo();

      expect(((f as unknown) as Meta).__meta__.key.get()).to.equal("attrib");
    });
  });

  describe("#relationship", (): void => {
    it("should set a relationship to the __meta__.key", (): void => {
      const store = createStore();
      class Bar {
        @primaryKey
        id: number = 0;
      }

      class Foo {
        @primaryKey
        attrib: number = 0;

        @relationship(store, () => Bar)
        friends: Bar[] = [];
      }

      const f = new Foo();

      expect(((f as unknown) as Meta).__meta__.relationships)
        .to.have.property("friends")
        .that.has.property("type")
        .that.is.eql(Bar);
    });

    it("should allow an options parameter to be passed into the relationship", (): void => {
      const store = createStore();
      class Bar {
        @primaryKey
        id: number = 0;
      }

      class Foo {
        @primaryKey
        attrib: number = 0;

        // TODO: Fill out options with cascade options
        @relationship(store, () => Bar, {})
        friends: Bar[] = [];
      }

      const f = new Foo();

      expect(((f as unknown) as Meta).__meta__.relationships)
        .to.have.property("friends")
        .that.has.property("options").that.is.empty;
    });

    it("should allow a user to replace an entity in a relationship by index", (): void => {
      const store = createStore();
      class Bar {
        @primaryKey
        id = uuid();
      }

      class Foo {
        @primaryKey
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
        @primaryKey
        id = uuid();

        @notNull(store)
        name = null;
      }

      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
    });
  });

  describe('#notUndefined', (): void => {
    it('should check that a given column is not undefine-able', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey
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
        @primaryKey
        id = uuid();

        @unique(store)
        name = '1';
      }

      addOne(store, new Foo());
      console.log(store.indicies['Foo'].get('1'))
      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
    });
  });
});
