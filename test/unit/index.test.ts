import { describe, it } from "mocha";
import { expect } from 'chai';

import createStore from '../../src';

describe('#index', (): void => {
  describe('#createStore', (): void => {
    const store = createStore();

    expect(store).to.have.all.keys([
      'store',
      'primaryKey',
      'relationship',
      'findAll',
      'findOne',
      'addOne',
      'addAll',
      'removeOne',
      'removeAll',
    ]);
  });
});
