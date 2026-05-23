import type { ParamsDictionary, Query } from "express-serve-static-core";

export type UserRole = "user" | "admin" | "contributor" | "maintainer";

export type IssueType = "bug" | "feature_request";

export type IssueStatus = "open" | "in_progress" | "resolved";

export type SortOrder = "newest" | "oldest";

export interface AppConfig {
  port: number;
  connectionString: string;
  jwtSecret: string;
}

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
}

export interface UserDbRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  email?: unknown;
  password?: unknown;
}

export interface SignupRequestBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

export interface EmptyRouteParams extends ParamsDictionary {}

export interface IdRouteParams extends ParamsDictionary {
  id: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string;
}

export interface IssueRow {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Reporter {
  id: number;
  name: string;
  role: UserRole;
}

export interface IssueWithReporter extends IssueRow {
  reporter: Reporter | null;
}

export interface SignupRequestBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
}

export interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}

export interface CreateIssueRequestBody {
  title?: unknown;
  description?: unknown;
  type?: unknown;
}

export interface UpdateIssueRequestBody {
  title?: unknown;
  description?: unknown;
  type?: unknown;
}

export interface IssueFilterQuery extends Query {
  sort?: string;
  type?: string;
  status?: string;
}
