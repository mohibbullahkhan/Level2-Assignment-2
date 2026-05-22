import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import type { AuthUser, UserRole } from "../types";
import { createHttpError } from "../utility";

const isUserRole = (value: unknown): value is UserRole => {
  return value === "contributor" || value === "maintainer";
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.id === "number" &&
    typeof payload.name === "string" &&
    isUserRole(payload.role)
  );
};

export const auth: RequestHandler = (req, _res, next): void => {
  const token = req.headers.authorization;

  if (!token) {
    next(createHttpError(StatusCodes.UNAUTHORIZED, "Authorization token is required"));
    return;
  }

  try {
    const decodedToken = jwt.verify(token, config.jwtSecret);

    if (!isAuthUser(decodedToken)) {
      next(createHttpError(StatusCodes.UNAUTHORIZED, "Invalid authorization token"));
      return;
    }

    req.user = decodedToken;
    next();
  } catch (error: unknown) {
    next(createHttpError(StatusCodes.UNAUTHORIZED, "Invalid authorization token"));
  }
};
