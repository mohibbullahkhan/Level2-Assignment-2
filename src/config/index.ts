import dotenv from "dotenv";
import type { AppConfig } from "../types";

dotenv.config();

const config: AppConfig = {
  port: Number(process.env.PORT) || 5000,
  connectionString: process.env.CONNECTIONSTRING || "",
  jwtSecret: process.env.JWT_SECRET || "devpulse-development-secret",
};

export default config;
