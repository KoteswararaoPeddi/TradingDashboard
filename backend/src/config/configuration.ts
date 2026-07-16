import { AppConfig } from "./config.types";

// Maps validated env vars into the typed AppConfig. Read this via ConfigService,
// never process.env, in feature code.
export default (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV as AppConfig["nodeEnv"]) ?? "development",
  port: parseInt(process.env.PORT ?? "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
});
