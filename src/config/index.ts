import dotenv from "dotenv";
import type { AppConfig } from "../types";

dotenv.config();

const connectionString =
  process.env.CONNECTIONSTRING || process.env.DATABASE_URL || "";

if (!connectionString) {
  throw new Error(
    "Database connection string is missing. Set CONNECTIONSTRING or DATABASE_URL in your .env file.",
  );
}

const config: AppConfig = {
  port: Number(process.env.PORT) || 5000,
  connectionString,
  jwtSecret: process.env.JWT_SECRET || "devpulse-development-secret",
};

export default config;
