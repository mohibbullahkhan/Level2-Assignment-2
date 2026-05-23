import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import pool from "../../db";
import type {
  LoginRequest,
  LoginResponse,
  SignupRequestBody,
  UserDbRow,
  UserResponse,
} from "../../types";
import { createHttpError } from "../../utility";

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const toUserResponse = (user: UserDbRow): UserResponse => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

export const signupUser = async (
  body: SignupRequestBody,
): Promise<LoginResponse> => {
  const { name, email, password } = body;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(password)
  ) {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Name, email, and password are required",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await pool.query<UserDbRow>(
    "SELECT id FROM users WHERE email = $1",
    [normalizedEmail],
  );

  if (existingUser.rows.length > 0) {
    throw createHttpError(StatusCodes.CONFLICT, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query<UserDbRow>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name.trim(), normalizedEmail, hashedPassword, "contributor"],
  );

  const user = result.rows[0];
  const accessToken = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: "15m" },
  );

  return {
    accessToken,
    user: toUserResponse(user),
  };
};

export const loginUser = async (body: LoginRequest): Promise<LoginResponse> => {
  const { email, password } = body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Email and password are required",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userResult = await pool.query<UserDbRow>(
    "SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1",
    [normalizedEmail],
  );
  const user = userResult.rows[0];

  if (!user) {
    throw createHttpError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password",
    );
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw createHttpError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password",
    );
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: "15m" },
  );

  return {
    accessToken,
    user: toUserResponse(user),
  };
};
