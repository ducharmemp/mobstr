import { describe, it } from "mocha";
import { expect } from "chai";
import sinon from "sinon";

import { indexed, primaryKey, relationship } from "../../src/decorators";
import { Meta } from "@src/meta";
import uuid = require("uuid");
import { createStore } from "@src/store";

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

    it("should allow an options parameter to be passed into the relationship", (): void => {
      class Bar {
        @primaryKey
        id: number = 0;
      }

      class Foo {
        @primaryKey
        attrib: number = 0;

        // TODO: Fill out options with cascade options
        @relationship(sinon.fake() as any, () => Bar, {})
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
});
