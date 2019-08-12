import { describe, it } from "mocha";
import { expect } from "chai";
import sinon from "sinon";

import { check, unique, notNull, notUndefined } from "../../src/constraints";
import { createStore, addOne } from "../../src/store";
import { primaryKey, indexed } from "@src/decorators";
import { IntegrityError } from "@src/errors";
import { dropAllTriggers } from "@src/triggers";

describe("#constraints", (): void => {
  describe("#check", (): void => {
    it("should allow the definition of a check constraint", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";

        name = "";
      }

      expect(() => check(store, Foo, "name", name => name.length !== 0)).to.not
        .throw;
      dropAllTriggers(store);
    });

    it("should allow single property names or multiple property names for a check constraint", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";

        name = "";

        age = 0;
      }

      expect(
        check(
          store,
          Foo,
          ["name", "age"],
          (name, age) => (name as string).length !== 0 && age !== 0
        )
      ).to.be.a(typeof 1);
      expect(
        check(store, Foo, "name", name => (name as string).length !== 0)
      ).to.be.a(typeof 1);
    });

    it("should allow the definition of a check constraint with multiple values", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";

        name = "";

        age = 0;
      }

      expect(() =>
        check(
          store,
          Foo,
          ["name", "age"],
          (name, age) => (name as string).length !== 0 && age !== 0
        )
      ).to.not.throw;
      dropAllTriggers(store);
    });

    it("should call the constraint when a value is added to the store", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";

        name = "";
      }

      const fake = sinon.fake.returns(true);
      check(store, Foo, "name", fake);
      addOne(store, new Foo());
      expect(fake.callCount).to.be.equal(1);
      dropAllTriggers(store);
    });
  });

  describe("#notNull", (): void => {
    it("should check that the value is not null", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";

        name = null;
      }

      notNull(store, Foo, "name");
      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
      dropAllTriggers(store);
    });
  });

  describe("#notUndefined", (): void => {
    it("should check that the value is not undefined", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";

        name = undefined;
      }

      notUndefined(store, Foo, "name");
      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
      dropAllTriggers(store);
    });
  });

  describe("#unique", (): void => {
    it("should check that the value is unique", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "1234";

        @indexed
        name = "something";
      }

      unique(store, Foo, "name");
      addOne(store, new Foo());
      expect(() => addOne(store, new Foo())).to.throw(IntegrityError);
      dropAllTriggers(store);
    });
  });
});
