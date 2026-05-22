import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { ApiErrorResponse } from "../types";
import { HttpError } from "../utility";

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next): void => {
  const statusCode = error instanceof HttpError ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : "Internal server error";
  const errors =
    error instanceof HttpError && error.errors.trim().length > 0 ? error.errors : message;

  const response: ApiErrorResponse = {
    success: false,
    message,
    errors
  };

  res.status(statusCode).json(response);
};
