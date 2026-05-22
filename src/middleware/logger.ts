import type { RequestHandler } from "express";

export const logger: RequestHandler = (req, _res, next): void => {
  console.log(`${req.method} ${req.originalUrl} ${new Date().toISOString()}`);
  next();
};
