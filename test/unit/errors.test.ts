import { describe, it } from "mocha";
import { expect } from "chai";
import { IntegrityError } from "@src/errors";

describe('#errors', (): void => {
  it('should inherit from the native error type', (): void => {
    expect(new IntegrityError('')).to.be.an.instanceOf(Error);
  });
});
