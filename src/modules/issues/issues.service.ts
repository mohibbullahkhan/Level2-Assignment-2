import pool from "../../db";
import type {
  CreateIssueRequestBody,
  IssueFilterQuery,
  IssueRow,
  IssueType,
  IssueStatus,
  IssueWithReporter,
  Reporter,
  UpdateIssueRequestBody,
} from "../../types";

const attachReportersToIssues = async (
  issues: IssueRow[],
): Promise<IssueWithReporter[]> => {
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  if (reporterIds.length === 0) {
    return [];
  }

  const reporterResult = await pool.query<Reporter>(
    "SELECT id, name, role FROM users WHERE id = ANY($1::int[])",
    [reporterIds],
  );
  const reportersById = new Map<number, Reporter>(
    reporterResult.rows.map((reporter) => [reporter.id, reporter]),
  );

  return issues.map((issue) => ({
    ...issue,
    reporter: reportersById.get(issue.reporter_id) ?? null,
  }));
};

export const insertIssueQuery = async (
  title: string,
  description: string,
  type: IssueType,
  reporterId: number,
): Promise<IssueRow> => {
  const result = await pool.query<IssueRow>(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, reporterId],
  );

  return result.rows[0];
};

export const selectIssuesQuery = async (
  sort: "newest" | "oldest",
  type?: IssueType,
  status?: IssueStatus,
): Promise<IssueWithReporter[]> => {
  const whereClauses: string[] = [];
  const queryValues: Array<IssueType | IssueStatus> = [];

  if (type !== undefined) {
    queryValues.push(type);
    whereClauses.push(`type = $${queryValues.length}`);
  }

  if (status !== undefined) {
    queryValues.push(status);
    whereClauses.push(`status = $${queryValues.length}`);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const orderDirection = sort === "newest" ? "DESC" : "ASC";
  const issueResult = await pool.query<IssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${whereSql}
     ORDER BY created_at ${orderDirection}`,
    queryValues,
  );

  return attachReportersToIssues(issueResult.rows);
};

export const selectIssueByIdQuery = async (
  issueId: number,
): Promise<IssueWithReporter | null> => {
  const issueResult = await pool.query<IssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     WHERE id = $1`,
    [issueId],
  );
  const issue = issueResult.rows[0];

  if (!issue) {
    return null;
  }

  const [issueWithReporter] = await attachReportersToIssues([issue]);
  return issueWithReporter;
};

export const selectIssueRowByIdQuery = async (
  issueId: number,
): Promise<IssueRow | null> => {
  const issueResult = await pool.query<IssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     WHERE id = $1`,
    [issueId],
  );

  return issueResult.rows[0] ?? null;
};

export const updateIssueQuery = async (
  issueId: number,
  updateFields: Partial<Pick<IssueRow, "title" | "description" | "type">>,
): Promise<IssueRow> => {
  const updateClauses: string[] = [];
  const updateValues: Array<string> = [];

  if (updateFields.title !== undefined) {
    updateValues.push(updateFields.title);
    updateClauses.push(`title = $${updateValues.length}`);
  }

  if (updateFields.description !== undefined) {
    updateValues.push(updateFields.description);
    updateClauses.push(`description = $${updateValues.length}`);
  }

  if (updateFields.type !== undefined) {
    updateValues.push(updateFields.type);
    updateClauses.push(`type = $${updateValues.length}`);
  }

  const setSql =
    updateClauses.length > 0
      ? `${updateClauses.join(", ")}, updated_at = NOW()`
      : "updated_at = NOW()";

  updateValues.push(String(issueId));

  const result = await pool.query<IssueRow>(
    `UPDATE issues
     SET ${setSql}
     WHERE id = $${updateValues.length}
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    updateValues,
  );

  return result.rows[0];
};

export const deleteIssueQuery = async (
  issueId: number,
): Promise<IssueRow | null> => {
  const result = await pool.query<IssueRow>(
    "DELETE FROM issues WHERE id = $1 RETURNING id, title, description, type, status, reporter_id, created_at, updated_at",
    [issueId],
  );

  return result.rows[0] ?? null;
};
