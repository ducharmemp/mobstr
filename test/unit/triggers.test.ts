import { describe, it } from "mocha";
import { expect } from "chai";
import sinon from "sinon";

import {
  TriggerExecutionStrategy,
  TriggerQueryEvent,
  createCollectionTrigger,
  dropTrigger,
  executeTrigger
} from "../../src/triggers";
import { createStore, addOne, removeOne, findOne } from "../../src/store";
import { primaryKey, indexed } from "../../src/decorators";

describe("#triggers", (): void => {
  describe("#createCollectionTrigger", (): void => {
    it("should create a trigger in the store scoped to a collection", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";
      }

      const f = new Foo();
      addOne(store, f);
      const triggerId = createCollectionTrigger(store, Foo, () => {});
      expect(store.triggers.get(triggerId)).to.not.be.undefined;
    });

    it("should allow observations to a collection", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";
      }
      
      const fake = sinon.fake();
      createCollectionTrigger(store, Foo, fake);

      addOne(store, new Foo());
      expect(fake.callCount).to.be.equal(1);
    });

    it("should allow observations to a collection only on deletes", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";
      }

      const fake = sinon.fake();
      const foo = new Foo();
      createCollectionTrigger(store, Foo, fake, {
        eventTypes: new Set([TriggerQueryEvent.Delete])
      });

      addOne(store, foo);
      expect(fake.callCount).to.be.equal(0);
      removeOne(store, foo);
      expect(fake.callCount).to.be.eql(1);
    });

    it("should allow intercepts on a collection", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";
      }

      const fake = sinon.fake();
      const foo = new Foo();
      createCollectionTrigger(store, Foo, fake, { triggerExecutionStrategy: TriggerExecutionStrategy.Intercept });

      addOne(store, foo);
      addOne(store, foo);
      expect(fake.callCount).to.be.equal(2);
    });

    it("should allow intercepts to rewrite the value", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "1234";

        @indexed
        name = 'foo'
      }

      const foo = new Foo();
      // TODO: This does *NOT* allow us to rewrite the primary key. I need to document that or log a warning when the user does it
      createCollectionTrigger(store, Foo, change => {
        ((change as any).newValue as Foo).name = 'other';
        return change;
      }, { triggerExecutionStrategy: TriggerExecutionStrategy.Intercept });

      addOne(store, foo);
      expect(findOne(store, Foo, '1234').name).to.be.eql('other');
    });
  });

  describe("#dropTrigger", (): void => {
    it("should delete a trigger from the database", (): void => {
      const store = createStore();
      class Foo {
        @primaryKey
        id = "";
      }

      const triggerId = createCollectionTrigger(store, Foo, () => {});
      expect(store.triggers.get(triggerId)).to.not.be.undefined;
      dropTrigger(store, triggerId);
      expect(store.triggers.get(triggerId)).to.be.undefined;
    });
  });

  describe("#executeTrigger", (): void => {});
});
