import { StatusCodes } from "http-status-codes";
import type {
  EmptyRouteParams,
  LoginRequest,
  SignupRequestBody,
} from "../../types";
import { asyncWrapper, sendResponse } from "../../utility";
import { loginUser, signupUser } from "./auth.service";

export const signup = asyncWrapper<EmptyRouteParams, SignupRequestBody>(
  async (req, res) => {
    const data = await signupUser(req.body);

    sendResponse(res, StatusCodes.CREATED, "Signup successful", {
      accessToken: data.accessToken,
      user: data.user,
    });
  },
);

export const login = asyncWrapper<EmptyRouteParams, LoginRequest>(
  async (req, res) => {
    const data = await loginUser(req.body);

    sendResponse(res, StatusCodes.OK, "Login successful", {
      accessToken: data.accessToken,
      user: data.user,
    });
  },
);
