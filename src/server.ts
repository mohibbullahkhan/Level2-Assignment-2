import app from "./app";
import config from "./config";

app.listen(config.port, () => {
  console.log(`DevPulse API is running on port ${config.port}`);
});
