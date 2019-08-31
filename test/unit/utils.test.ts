import { describe, it } from "mocha";
import { expect } from "chai";

import { ensureMeta, ensureRelationship, getMeta, ensureConstructorMeta } from "../../src/utils";
import { primaryKey } from "../../src/decorators";

describe("#utils", (): void => {
  describe("#ensureMeta", (): void => {
    it("should add a meta attribute to objects that do not have one", (): void => {
      const o = {};
      ensureMeta(o);
      expect(o).to.haveOwnProperty("__meta__");
    });

    it("should add a meta attribute to an object regardless of whether one exists on the prototype", (): void => {
      class Bar {}
      class Foo extends Bar {}

      ensureMeta(Bar);
      expect(Bar).to.haveOwnProperty("__meta__");
      expect(Foo).to.have.property("__meta__");
      ensureMeta(Foo);
      expect(Foo).to.haveOwnProperty("__meta__");
    });
  });

  describe("#ensureRelationship", (): void => {
    it("should ensure that a relationship is added to a meta attribute", (): void => {
      class Bar {}
      class Foo {}
      ensureMeta(Foo);
      ensureMeta(Bar);
      ensureRelationship(Foo, "friends", () => Bar, {});
      expect(Foo)
        .to.have.property("__meta__")
        .that.has.property("relationships")
        .that.has.property("friends")
        .that.has.property("type", Bar);
    });
  });

  describe("#getMeta", (): void => {
    it("should return the metadata associated with a given object", (): void => {
      class Foo {
        @primaryKey({} as any)
        id = "name";
      }

      const f = new Foo();

      expect(getMeta(f)).to.exist;
    });
  });

  describe("#ensureConstructorMeta", (): void => {
    it('should attach a meta object onto the prototype', (): void => {
      class Foo {}
      ensureConstructorMeta(new Foo())
      expect(Foo).to.haveOwnProperty('__meta__');
    });

    it('should not attach a meta object onto the prototype if the prototype is Object', (): void => {
      class Foo {}
      ensureConstructorMeta(Foo)
      expect(Foo).to.not.haveOwnProperty('__meta__');
    });
  });
});
