import { describe, it } from "mocha";
import { expect } from "chai";

import createStore from "../../src";

describe("#index", (): void => {
  describe("#createStore", (): void => {
    it("should create a store with all expected values (less of a unit test and more of a sanity test)", (): void => {
      expect(createStore()).to.have.all.keys([
        "store",
        "primaryKey",
        "relationship",
        "findAll",
        "findOne",
        "addOne",
        "addAll",
        "removeOne",
        "removeAll"
      ]);
    });
  });
});
