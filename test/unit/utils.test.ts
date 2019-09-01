import { describe, it } from "mocha";
import { expect } from "chai";

import {
  ensureMeta,
  ensureRelationship,
  getMeta,
  ensureConstructorMeta,
  getOnlyOne,
  getIndexKey
} from "../../src/utils";
import { primaryKey } from "../../src/decorators";
import { NoResultsFound, MultipleResultsFound } from "../../src/errors";

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
        @primaryKey
        id = "name";
      }

      const f = new Foo();

      expect(getMeta(f)).to.exist;
    });
  });

  describe("#ensureConstructorMeta", (): void => {
    it("should attach a meta object onto the prototype", (): void => {
      class Foo {}
      ensureConstructorMeta(new Foo());
      expect(Foo).to.haveOwnProperty("__meta__");
    });

    it("should not attach a meta object onto the prototype if the prototype is Object", (): void => {
      class Foo {}
      ensureConstructorMeta(Foo);
      expect(Foo).to.not.haveOwnProperty("__meta__");
    });
  });

  describe("#getOnlyOne", (): void => {
    it("should return a single value from a list", () => {
      expect(getOnlyOne([1])).to.eql(1);
    });

    it("should throw an exception when there are no values in the list", (): void => {
      expect(() => getOnlyOne([])).to.throw(NoResultsFound);
    });

    it("should throw an exception when there are too many values in the list", (): void => {
      expect(() => getOnlyOne([1, 2])).to.throw(MultipleResultsFound);
    });
  });

  describe("#getIndexKey", (): void => {
    it("should return a primitive value when provided a primitive", (): void => {
      expect(getIndexKey(1)).to.eql(1);
    });

    it('should return a hash when provided an object', (): void => {
      expect(getIndexKey({ foo: 1 })).to.eql('398d5c982d815a5000ff5cee2fdbc114d24125e2');
    });
  });
});
