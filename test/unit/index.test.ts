import { describe, it } from "mocha";
import { expect } from "chai";

import { initializeStore } from "../../src/index";

describe("#index", (): void => {
  describe("#createStore", (): void => {
    it("should create a store with all expected values (less of a unit test and more of a sanity test)", (): void => {
      expect(initializeStore()).to.have.all.keys([
        "store",
        "primaryKey",
        "relationship",
        "indexed",
        "findAll",
        "findOne",
        "findAllBy",
        "findOneBy",
        "addOne",
        "addAll",
        "removeOne",
        "removeAll",
        "truncateCollection",
        "dropTrigger",
        "createCollectionTrigger",
        "dropAllTriggers",
        "checkNotNull",
        "checkNotUndefined",
        "checkUnique",
        "check",
        "notNull",
        "notUndefined",
        "setCheck",
        "unique",
        "dropAllConstraints",
        "dropConstraint"
      ]);
    });
  });
});
