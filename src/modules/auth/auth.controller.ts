import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import pool from "../../db";
import type {
  EmptyRouteParams,
  LoginRequestBody,
  LoginResponse,
  PublicUser,
  SignupRequestBody,
  UserRole,
  UserRow
} from "../../types";
import { asyncWrapper, createHttpError, sendResponse } from "../../utility";

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isUserRole = (value: unknown): value is UserRole => {
  return value === "contributor" || value === "maintainer";
};

const toPublicUser = (user: UserRow): PublicUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
};

export const signup = asyncWrapper<EmptyRouteParams, SignupRequestBody>(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Name, email, and password are required");
  }

  const requestedRole = role ?? "contributor";

  if (!isUserRole(requestedRole)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Role must be contributor or maintainer");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUserResult = await pool.query<UserRow>("SELECT id FROM users WHERE email = $1", [
    normalizedEmail
  ]);

  if (existingUserResult.rows.length > 0) {
    throw createHttpError(StatusCodes.CONFLICT, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const createdUserResult = await pool.query<UserRow>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, password, role, created_at, updated_at`,
    [name.trim(), normalizedEmail, hashedPassword, requestedRole]
  );

  sendResponse(
    res,
    StatusCodes.CREATED,
    "User created successfully",
    toPublicUser(createdUserResult.rows[0])
  );
});

export const login = asyncWrapper<EmptyRouteParams, LoginRequestBody>(async (req, res) => {
  const { email, password } = req.body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Email and password are required");
  }

  const userResult = await pool.query<UserRow>(
    "SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1",
    [email.trim().toLowerCase()]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role
    },
    config.jwtSecret
  );
  const data: LoginResponse = {
    token,
    user: toPublicUser(user)
  };

  sendResponse(res, StatusCodes.OK, "Login successful", data);
});
