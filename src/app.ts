import cors from "cors";
import express from "express";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { logger } from "./middleware/logger";
import authRoutes from "./modules/auth/auth.route";
import issueRoutes from "./modules/issues/issues.routes";

const app = express();

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API is running",
    data: null,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

app.use(globalErrorHandler);

export { app };
export default app;
