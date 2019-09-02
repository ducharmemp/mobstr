import { expect } from "chai";

import { range, uniqueId } from "lodash";

import logger from "../src/logger";
import { initializeStore } from "../dist/index.js";

describe("#performance", (): void => {
  const {
    store,
    addAll,
    primaryKey,
    truncateCollection,
    dropTrigger,
    check,
    notNull,
    notUndefined,
    unique,
    findAll,
    findAllBy,
    indexed,
    dropAllConstraints
  } = initializeStore();
  const times = range(100000);

  class Foo {
    @primaryKey
    id = uniqueId();

    number = Math.random();
  }

  class CheckedFoo {
    @unique
    @primaryKey
    id = uniqueId();

    @notNull
    @notUndefined
    @indexed
    age = Math.random();
  }

  let foos: Foo[];
  let checkedFoos: CheckedFoo[];
  let subset: Foo[];

  before((): void => {
    foos = times.map(() => new Foo());
    checkedFoos = times.map(() => new CheckedFoo());
    subset = foos.slice(0, 500);
    const triggerId = check(Foo, "number", value => value > 0);
    addAll(foos);
    addAll(checkedFoos);
    truncateCollection(Foo);
    truncateCollection(CheckedFoo);
    dropTrigger(triggerId);
  });

  afterEach((): void => {
    truncateCollection(Foo);
    truncateCollection(CheckedFoo);
    expect(findAll(Foo)).to.have.lengthOf(0);
    expect(findAll(CheckedFoo)).to.have.lengthOf(0);
  });

  after((): void => {
    expect(findAll(Foo)).to.have.lengthOf(0);
    expect(findAll(CheckedFoo)).to.have.lengthOf(0);
  });

  it("should be performant in adding a 500 item subset of the items to a collection", (): void => {
    logger.profile("500");
    addAll(subset);
    logger.profile("500");
  });

  it("should be performant in adding 100k amounts of items to a collection", (): void => {
    logger.profile("100k");
    addAll(foos);
    logger.profile("100k");
  });

  it("should be performant in adding 100k items and then dropping a collection", (): void => {
    logger.profile("addAllAndTruncate");
    addAll(foos);
    truncateCollection(Foo);
    logger.profile("addAllAndTruncate");
  });

  it("should be performant in adding 100k items with a constraint", (): void => {
    logger.profile("addAllConstraint");
    check(Foo, "number", value => value > 0);
    addAll(foos);
    logger.profile("addAllConstraint");
  });

  it("should be performant in adding 100k items with multiple decorator constraints", (): void => {
    logger.profile("allAllDecorator");
    addAll(checkedFoos);
    logger.profile("allAllDecorator");
  });

  it("should be performant in adding 100k items with multiple decorator constraints and then finding all by an indexed value", (): void => {
    logger.profile("allAllDecorator");
    addAll(checkedFoos);
    findAllBy(CheckedFoo, "age" as any, checkedFoos[0].age);
    logger.profile("allAllDecorator");
  });

  it("should be (slightly) faster when constraints are turned off", () => {
    logger.profile("disableConstraintChecks");
    store.options.disableConstraintChecks = true;
    addAll(checkedFoos);
    logger.profile("disableConstraintChecks");
  });

  it("should be faster when constraints are turned off via drop all constraints", () => {
    logger.profile("disableConstraintChecks");
    dropAllConstraints();
    addAll(checkedFoos);
    logger.profile("disableConstraintChecks");
  });
});
