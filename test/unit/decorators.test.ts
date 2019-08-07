import { describe, it } from "mocha";
import { expect } from "chai";
import sinon from "sinon";

import { indexed, primaryKey, relationship } from "../../src/decorators";
import { Meta } from "@src/meta";

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
      class Bar {
        @primaryKey
        id: number = 0;
      }

      class Foo {
        @primaryKey
        attrib: number = 0;

        @relationship(sinon.fake() as any, () => Bar)
        friends: Bar[] = [];
      }

      const f = new Foo();

      expect(((f as unknown) as Meta).__meta__.relationships)
        .to.have.property("friends")
        .that.has.property("type")
        .that.is.eql(Bar);
    });
  });
});
