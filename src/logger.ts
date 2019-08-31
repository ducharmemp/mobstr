import { createLogger, format, transports } from "winston";

export default createLogger({
  level: process.env.NODE_ENV !== "production" ? 'verbose' : "warn",
  format: format.json(),
  transports: [new transports.Console()]
});
