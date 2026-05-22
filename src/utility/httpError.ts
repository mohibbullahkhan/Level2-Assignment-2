export class HttpError extends Error {
  public readonly statusCode: number;

  public readonly errors: string;

  public constructor(statusCode: number, message: string, errors = message) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const createHttpError = (
  statusCode: number,
  message: string,
  errors = message
): HttpError => {
  return new HttpError(statusCode, message, errors);
};
