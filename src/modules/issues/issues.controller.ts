import { StatusCodes } from "http-status-codes";
import pool from "../../db";
import type {
  AuthUser,
  CreateIssueRequestBody,
  EmptyRouteParams,
  IdRouteParams,
  IssueFilterQuery,
  IssueRow,
  IssueStatus,
  IssueType,
  IssueWithReporter,
  Reporter,
  SortOrder,
  UpdateIssueRequestBody
} from "../../types";
import { asyncWrapper, createHttpError, sendResponse } from "../../utility";

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
    throw createHttpError(StatusCodes.UNAUTHORIZED, "Authentication is required");
  }

  return user;
};

const parseIssueId = (id: string): number => {
  const issueId = Number(id);

  if (!Number.isInteger(issueId) || issueId <= 0) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Issue id must be a positive integer");
  }

  return issueId;
};

const validateTitle = (title: unknown): string => {
  if (!isNonEmptyString(title)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Title is required");
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length > 150) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Title must be 150 characters or fewer");
  }

  return trimmedTitle;
};

const validateDescription = (description: unknown): string => {
  if (!isNonEmptyString(description)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Description is required");
  }

  const trimmedDescription = description.trim();

  if (trimmedDescription.length < 20) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Description must be at least 20 characters");
  }

  return trimmedDescription;
};

const validateIssueType = (type: unknown): IssueType => {
  if (!isIssueType(type)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Type must be bug or feature_request");
  }

  return type;
};

const validateSortOrder = (sort: string | undefined): SortOrder => {
  if (!sort) {
    return "newest";
  }

  if (sort !== "newest" && sort !== "oldest") {
    throw createHttpError(StatusCodes.BAD_REQUEST, "Sort must be newest or oldest");
  }

  return sort;
};

const fetchIssueById = async (issueId: number): Promise<IssueRow> => {
  const issueResult = await pool.query<IssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     WHERE id = $1`,
    [issueId]
  );
  const issue = issueResult.rows[0];

  if (!issue) {
    throw createHttpError(StatusCodes.NOT_FOUND, "Issue not found");
  }

  return issue;
};

const attachReportersToIssues = async (issues: IssueRow[]): Promise<IssueWithReporter[]> => {
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  if (reporterIds.length === 0) {
    return [];
  }

  const reporterResult = await pool.query<Reporter>(
    "SELECT id, name, role FROM users WHERE id = ANY($1::int[])",
    [reporterIds]
  );
  const reportersById = new Map<number, Reporter>(
    reporterResult.rows.map((reporter) => [reporter.id, reporter])
  );

  return issues.map((issue) => ({
    ...issue,
    reporter: reportersById.get(issue.reporter_id) ?? null
  }));
};

export const createIssue = asyncWrapper<EmptyRouteParams, CreateIssueRequestBody>(
  async (req, res) => {
    const user = getAuthenticatedUser(req.user);
    const title = validateTitle(req.body.title);
    const description = validateDescription(req.body.description);
    const type = validateIssueType(req.body.type);

    const createdIssueResult = await pool.query<IssueRow>(
      `INSERT INTO issues (title, description, type, reporter_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
      [title, description, type, user.id]
    );

    sendResponse(res, StatusCodes.CREATED, "Issue created successfully", createdIssueResult.rows[0]);
  }
);

export const getIssues = asyncWrapper<
  EmptyRouteParams,
  unknown,
  IssueFilterQuery
>(async (req, res) => {
  const sort = validateSortOrder(req.query.sort);
  const whereClauses: string[] = [];
  const queryValues: string[] = [];

  if (req.query.type !== undefined) {
    const type = validateIssueType(req.query.type);
    queryValues.push(type);
    whereClauses.push(`type = $${queryValues.length}`);
  }

  if (req.query.status !== undefined) {
    if (!isIssueStatus(req.query.status)) {
      throw createHttpError(StatusCodes.BAD_REQUEST, "Status must be open, in_progress, or resolved");
    }

    queryValues.push(req.query.status);
    whereClauses.push(`status = $${queryValues.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const orderDirection = sort === "newest" ? "DESC" : "ASC";
  const issueResult = await pool.query<IssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${whereSql}
     ORDER BY created_at ${orderDirection}`,
    queryValues
  );
  const issuesWithReporters = await attachReportersToIssues(issueResult.rows);

  sendResponse(res, StatusCodes.OK, "Issues retrieved successfully", issuesWithReporters);
});

export const getIssueById = asyncWrapper<IdRouteParams>(async (req, res) => {
  const issueId = parseIssueId(req.params.id);
  const issue = await fetchIssueById(issueId);
  const [issueWithReporter] = await attachReportersToIssues([issue]);

  sendResponse(res, StatusCodes.OK, "Issue retrieved successfully", issueWithReporter);
});

export const updateIssue = asyncWrapper<IdRouteParams, UpdateIssueRequestBody>(
  async (req, res) => {
    const user = getAuthenticatedUser(req.user);
    const issueId = parseIssueId(req.params.id);
    const existingIssue = await fetchIssueById(issueId);

    if (user.role === "contributor" && existingIssue.reporter_id !== user.id) {
      throw createHttpError(StatusCodes.FORBIDDEN, "Contributors can update only their own issues");
    }

    if (user.role === "contributor" && existingIssue.status !== "open") {
      throw createHttpError(StatusCodes.CONFLICT, "Contributors can update only open issues");
    }

    const updateClauses: string[] = [];
    const updateValues: Array<string | number> = [];

    if (req.body.title !== undefined) {
      updateValues.push(validateTitle(req.body.title));
      updateClauses.push(`title = $${updateValues.length}`);
    }

    if (req.body.description !== undefined) {
      updateValues.push(validateDescription(req.body.description));
      updateClauses.push(`description = $${updateValues.length}`);
    }

    if (req.body.type !== undefined) {
      updateValues.push(validateIssueType(req.body.type));
      updateClauses.push(`type = $${updateValues.length}`);
    }

    const setSql =
      updateClauses.length > 0 ? `${updateClauses.join(", ")}, updated_at = NOW()` : "updated_at = NOW()";
    updateValues.push(issueId);

    const updatedIssueResult = await pool.query<IssueRow>(
      `UPDATE issues
       SET ${setSql}
       WHERE id = $${updateValues.length}
       RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
      updateValues
    );

    sendResponse(res, StatusCodes.OK, "Issue updated successfully", updatedIssueResult.rows[0]);
  }
);

export const deleteIssue = asyncWrapper<IdRouteParams>(async (req, res) => {
  const user = getAuthenticatedUser(req.user);
  const issueId = parseIssueId(req.params.id);

  if (user.role !== "maintainer") {
    throw createHttpError(StatusCodes.FORBIDDEN, "Only maintainers can delete issues");
  }

  const deletedIssueResult = await pool.query<IssueRow>(
    "DELETE FROM issues WHERE id = $1 RETURNING id, title, description, type, status, reporter_id, created_at, updated_at",
    [issueId]
  );

  if (deletedIssueResult.rowCount === 0) {
    throw createHttpError(StatusCodes.NOT_FOUND, "Issue not found");
  }

  sendResponse(res, StatusCodes.OK, "Issue deleted successfully", null);
});
