import { Constructor } from "./types";

/**
 * @module errors
 */
// Can't subclass Error here since we're transpiling to ES5
function IntegrityErrorConstructor(this: any, message: string) {
  this.name = "IntegrityError";
  this.stack = new Error().stack;
  this.message = message;
}
IntegrityErrorConstructor.prototype = Object.create(Error.prototype);
IntegrityErrorConstructor.prototype.constructor = IntegrityErrorConstructor;

export const IntegrityError = IntegrityErrorConstructor as unknown as Constructor<Error>;
