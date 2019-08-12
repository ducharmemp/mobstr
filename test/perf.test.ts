import { range } from "lodash";
import { v4 as uuid } from "uuid";

import createStore from "../dist/index";

describe("#performance", (): void => {
  const {
    addAll,
    primaryKey,
    truncateCollection,
    dropAllTriggers,
    check,
    notNull,
    notUndefined,
    unique,
  } = createStore();
  const times = range(100000);

  class Foo {
    @primaryKey
    id = uuid();

    number = Math.random();
  }

  class CheckedFoo {
    @unique
    @primaryKey
    id = uuid();

    @notNull
    @notUndefined
    age = 5;
  }

  let foos: Foo[];
  let checkedFoos: CheckedFoo[];
  let subset: Foo[];

  before((): void => {
    foos = times.map(() => new Foo());
    checkedFoos = times.map(() => new CheckedFoo());
    subset = foos.slice(0, 500);
    check(Foo, "number", value => value > 0);
    addAll(foos);
    addAll(checkedFoos);
    truncateCollection(Foo);
    truncateCollection(CheckedFoo);
    dropAllTriggers();
  });

  afterEach((): void => {
    truncateCollection(Foo);
    dropAllTriggers();
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
    truncateCollection(Foo);
  });

  it("should be performant in adding 100k items with a constraint", (): void => {
    check(Foo, "number", value => value > 0);
    addAll(foos);
    truncateCollection(Foo);
  });

  it("should be performant in adding 100k items with multiple decorator constraints", (): void => {
    addAll(checkedFoos);
    truncateCollection(CheckedFoo);
  });
});
