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

function MultipleResultsFoundConstructor(this: any, message: string) {
  this.name = "MultipleResultsFound";
  this.stack = new Error().stack;
  this.message = message;
}

MultipleResultsFoundConstructor.prototype = Object.create(Error.prototype);
MultipleResultsFoundConstructor.prototype.constructor = MultipleResultsFoundConstructor;

function NoResultsFoundConstructor(this: any, message: string) {
  this.name = "NoResultsFoundConstructor";
  this.stack = new Error().stack;
  this.message = message;
}

NoResultsFoundConstructor.prototype = Object.create(Error.prototype);
NoResultsFoundConstructor.prototype.constructor = NoResultsFoundConstructor;

export const IntegrityError = (IntegrityErrorConstructor as unknown) as Constructor<
  Error
>;
export const MultipleResultsFound = (MultipleResultsFoundConstructor as unknown) as Constructor<
  Error
>;
export const NoResultsFound = (NoResultsFoundConstructor as unknown) as Constructor<
  Error
>;
