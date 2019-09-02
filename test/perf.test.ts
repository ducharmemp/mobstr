import { expect } from "chai";

import range from "lodash.range";

import { initializeStore } from "../dist/index.js";

describe("#performance", (): void => {
  let curId = 0;
  function uniqueId() {
    return curId += 1;
  }


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
    addAll(subset);
  });

  it("should be performant in adding 100k amounts of items to a collection", (): void => {
    addAll(foos);
  });

  it("should be performant in adding 100k items and then dropping a collection", (): void => {
    addAll(foos);
    truncateCollection(Foo);
  });

  it("should be performant in adding 100k items with a constraint", (): void => {
    check(Foo, "number", value => value > 0);
    addAll(foos);
  });

  it("should be performant in adding 100k items with multiple decorator constraints", (): void => {
    addAll(checkedFoos);
  });

  it("should be performant in adding 100k items with multiple decorator constraints and then finding all by an indexed value", (): void => {
    addAll(checkedFoos);
    findAllBy(CheckedFoo, "age" as any, checkedFoos[0].age);
  });

  it("should be (slightly) faster when constraints are turned off", () => {
    store.options.disableConstraintChecks = true;
    addAll(checkedFoos);
  });

  it("should be faster when constraints are turned off via drop all constraints", () => {
    dropAllConstraints();
    addAll(checkedFoos);
  });
});
