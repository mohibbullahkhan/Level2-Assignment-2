import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

type AsyncRequestHandler<
  Params extends ParamsDictionary = ParamsDictionary,
  RequestBody = unknown,
  RequestQuery extends Query = Query
> = (
  req: Request<Params, unknown, RequestBody, RequestQuery>,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncWrapper = <
  Params extends ParamsDictionary = ParamsDictionary,
  RequestBody = unknown,
  RequestQuery extends Query = Query
>(
  handler: AsyncRequestHandler<Params, RequestBody, RequestQuery>
): RequestHandler<Params, unknown, RequestBody, RequestQuery> => {
  return (req, res, next): void => {
    void handler(req, res, next).catch(next);
  };
};
