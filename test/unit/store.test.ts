/*
TODO: Most of these cases are handled in integration, but I will fill out later for completeness
*/
import { v4 as uuid } from 'uuid';
import { describe, it } from "mocha";
import { expect } from "chai";
import { range } from 'lodash';

import { addAll, removeAll, findAll, createStore } from "../../src/store";
import { primaryKey } from "@src/decorators";

describe("#store", (): void => {
  describe('#addAll', (): void => {
    it('should allow users to add multiple values to the store at once', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey
        id = uuid();
      }

      addAll(store, range(5).map(() => new Foo()));
      expect(store).to.have.property('collections').that.has.property('Foo').that.has.lengthOf(5);
    });
  });

  describe('#findAll', (): void => {
    it('should allow users to find multiple values to the store at once by a specific query', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey
        id = uuid();

        name = 'test'
      }

      addAll(store, range(5).map(() => new Foo()));
      const f = new Foo();
      f.name = 'test2';
      addAll(store, [f]);
      // This name lies, TS things it's a typeof Foo rather than a Foo. Need to fix the generic types.
      expect(findAll(store, Foo, (entity) => entity.name === 'test')).to.have.lengthOf(5);
      expect(findAll(store, Foo, (entity) => entity.name === 'test2')).to.have.lengthOf(1);
    });
  });

  describe('#removeAll', (): void => {
    it('should allow users to remove multiple values to the store at once', (): void => {
      const store = createStore();

      class Foo {
        @primaryKey
        id = uuid();
      }

      const foos = range(5).map(() => new Foo());
      addAll(store, foos);
      expect(store).to.have.property('collections').that.has.property('Foo').that.has.lengthOf(5);
      removeAll(store, foos);
      expect(store).to.have.property('collections').that.has.property('Foo').that.has.lengthOf(0);
    });
  });
});
