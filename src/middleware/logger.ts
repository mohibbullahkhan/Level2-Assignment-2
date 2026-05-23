import { appendFile } from "fs";
import path from "path";
import type { RequestHandler } from "express";

const filePath = path.join(process.cwd(), "logger.txt");

export const logger: RequestHandler = (req, _res, next): void => {
  const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl}`;

  appendFile(filePath, `${line}\n`, (error) => {
    if (error) {
      console.error("Logger error:", error);
    }
  });

  next();
};
