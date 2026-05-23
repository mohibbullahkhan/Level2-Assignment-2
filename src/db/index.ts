import bcrypt from "bcryptjs";
import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString: config.connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'contributor', 'maintainer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('bug', 'feature_request')),
  status VARCHAR NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const defaultUsers = [
  {
    name: "Maintainer",
    email: "maintainer@example.com",
    password: "Password123!",
    role: "maintainer",
  },
  {
    name: "Contributor",
    email: "contributor@example.com",
    password: "Password123!",
    role: "contributor",
  },
];

export const initDB = async (): Promise<void> => {
  await pool.query(schemaSql);

  for (const user of defaultUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [user.name, user.email, passwordHash, user.role],
    );
  }

  console.log("Database schema checked/created successfully.");
};

export default pool;
