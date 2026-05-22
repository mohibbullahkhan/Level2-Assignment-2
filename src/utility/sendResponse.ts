import type { Response } from "express";
import type { ApiSuccessResponse } from "../types";

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T
): void => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    data
  };

  res.status(statusCode).json(response);
};
