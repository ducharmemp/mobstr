/* istanbul ignore file */
import * as loglevel from 'loglevel';

loglevel.setLevel(process.env.NODE_ENV !== "production" ? loglevel.levels.TRACE : loglevel.levels.WARN);
export default loglevel;
