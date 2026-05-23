import app from "./app";
import config from "./config";
import { initDB } from "./db";

const startServer = async (): Promise<void> => {
  await initDB();

  app.listen(config.port, () => {
    console.log(`DevPulse API is running on port ${config.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
