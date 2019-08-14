/**
 * @module errors
 */
// All subclasses of IntegrityError must subclass Error properly as documented here: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
export class IntegrityError extends Error {
  public constructor(message: string) {
    /* istanbul ignore next */
    super(message);
    this.name = "IntegrityError";
    this.message = message;
    /* istanbul ignore next */
    Object.setPrototypeOf(this, IntegrityError.prototype);
  }
}
