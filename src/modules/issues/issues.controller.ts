import { StatusCodes } from "http-status-codes";
import type {
  AuthUser,
  CreateIssueRequestBody,
  EmptyRouteParams,
  IdRouteParams,
  IssueFilterQuery,
  IssueStatus,
  IssueType,
  IssueRow,
  UpdateIssueRequestBody,
} from "../../types";
import { asyncWrapper, createHttpError, sendResponse } from "../../utility";
import {
  deleteIssueQuery,
  insertIssueQuery,
  selectIssueByIdQuery,
  selectIssueRowByIdQuery,
  selectIssuesQuery,
  updateIssueQuery,
} from "./issues.service";

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isIssueType = (value: unknown): value is IssueType => {
  return value === "bug" || value === "feature_request";
};

const isIssueStatus = (value: unknown): value is IssueStatus => {
  return value === "open" || value === "in_progress" || value === "resolved";
};

const getAuthenticatedUser = (user: AuthUser | undefined): AuthUser => {
  if (!user) {
    throw createHttpError(
      StatusCodes.UNAUTHORIZED,
      "Authentication is required",
    );
  }

  return user;
};

const parseIssueId = (id: string): number => {
  const issueId = Number(id);

  if (!Number.isInteger(issueId) || issueId <= 0) {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Issue id must be a positive integer",
    );
  }

  return issueId;
};

const validateTitle = (title: unknown): string => {
  if (!isNonEmptyString(title)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Title is required");
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length > 150) {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Title must be 150 characters or fewer",
    );
  }

  return trimmedTitle;
};

const validateDescription = (description: unknown): string => {
  if (!isNonEmptyString(description)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Description is required");
  }

  const trimmedDescription = description.trim();

  if (trimmedDescription.length < 20) {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Description must be at least 20 characters",
    );
  }

  return trimmedDescription;
};

const validateIssueType = (type: unknown): IssueType => {
  if (!isIssueType(type)) {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Type must be bug or feature_request",
    );
  }

  return type;
};

const validateIssueStatus = (status: unknown): IssueStatus => {
  if (!isIssueStatus(status)) {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Status must be open, in_progress, or resolved",
    );
  }

  return status;
};

const validateSortOrder = (sort: string | undefined): "newest" | "oldest" => {
  if (!sort) {
    return "newest";
  }

  if (sort !== "newest" && sort !== "oldest") {
    throw createHttpError(
      StatusCodes.BAD_REQUEST,
      "Sort must be newest or oldest",
    );
  }

  return sort;
};

export const createIssue = asyncWrapper<
  EmptyRouteParams,
  CreateIssueRequestBody
>(async (req, res) => {
  const user = getAuthenticatedUser(req.user);
  const title = validateTitle(req.body.title);
  const description = validateDescription(req.body.description);
  const type = validateIssueType(req.body.type);

  const issue = await insertIssueQuery(title, description, type, user.id);
  sendResponse(res, StatusCodes.CREATED, "Issue created successfully", issue);
});

export const getIssues = asyncWrapper<
  EmptyRouteParams,
  unknown,
  IssueFilterQuery
>(async (req, res) => {
  const sort = validateSortOrder(req.query.sort);
  const type =
    req.query.type !== undefined
      ? validateIssueType(req.query.type)
      : undefined;
  const status =
    req.query.status !== undefined
      ? validateIssueStatus(req.query.status)
      : undefined;

  const issues = await selectIssuesQuery(sort, type, status);
  sendResponse(res, StatusCodes.OK, "Issues retrieved successfully", issues);
});

export const getIssueById = asyncWrapper<IdRouteParams>(async (req, res) => {
  const issueId = parseIssueId(req.params.id);
  const issue = await selectIssueByIdQuery(issueId);

  if (!issue) {
    throw createHttpError(StatusCodes.NOT_FOUND, "Issue not found");
  }

  sendResponse(res, StatusCodes.OK, "Issue retrieved successfully", issue);
});

export const updateIssue = asyncWrapper<IdRouteParams, UpdateIssueRequestBody>(
  async (req, res) => {
    const user = getAuthenticatedUser(req.user);
    const issueId = parseIssueId(req.params.id);
    const existingIssue = await selectIssueRowByIdQuery(issueId);

    if (!existingIssue) {
      throw createHttpError(StatusCodes.NOT_FOUND, "Issue not found");
    }

    if (user.role === "contributor" && existingIssue.reporter_id !== user.id) {
      throw createHttpError(
        StatusCodes.FORBIDDEN,
        "Contributors can update only their own issues",
      );
    }

    if (user.role === "contributor" && existingIssue.status !== "open") {
      throw createHttpError(
        StatusCodes.CONFLICT,
        "Contributors can update only open issues",
      );
    }

    const updateFields: Partial<
      Pick<IssueRow, "title" | "description" | "type">
    > = {};

    if (req.body.title !== undefined) {
      updateFields.title = validateTitle(req.body.title);
    }

    if (req.body.description !== undefined) {
      updateFields.description = validateDescription(req.body.description);
    }

    if (req.body.type !== undefined) {
      updateFields.type = validateIssueType(req.body.type);
    }

    const issue = await updateIssueQuery(issueId, updateFields);
    sendResponse(res, StatusCodes.OK, "Issue updated successfully", issue);
  },
);

export const deleteIssue = asyncWrapper<IdRouteParams>(async (req, res) => {
  const user = getAuthenticatedUser(req.user);
  const issueId = parseIssueId(req.params.id);

  if (user.role !== "maintainer") {
    throw createHttpError(
      StatusCodes.FORBIDDEN,
      "Only maintainers can delete issues",
    );
  }

  const issue = await deleteIssueQuery(issueId);

  if (!issue) {
    throw createHttpError(StatusCodes.NOT_FOUND, "Issue not found");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Issue deleted successfully",
  });
});
