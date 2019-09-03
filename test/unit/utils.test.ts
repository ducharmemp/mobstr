import { describe, it } from "mocha";
import { expect } from "chai";

import {
  getOnlyOne,
  getIndexKey,
  invariant
} from "../../src/utils";
import { primaryKey } from "../../src/decorators";
import { NoResultsFound, MultipleResultsFound } from "../../src/errors";
import { createStore } from "@src/store";

describe("#utils", (): void => {
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

  describe("#invariant", () => {
    it("should throw an error if the invariant wasn't met", (): void => {
      expect(() => invariant(() => false, "Some message")).to.throw(Error, "Some message");
    });

    it("should not throw an error if the invariant was met", (): void => {
      expect(() => invariant(() => true, "Some message")).to.not.throw;
    });
  });
});
