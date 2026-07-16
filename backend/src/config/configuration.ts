import { AppConfig } from "./config.types";

// Maps validated env vars into the typed AppConfig. Read this via ConfigService,
// never process.env, in feature code.
export default (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV as AppConfig["nodeEnv"]) ?? "development",
  port: parseInt(process.env.PORT ?? "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  },
  mail: {
    user: process.env.GMAIL_USER as string,
    appPassword: process.env.GMAIL_APP_PASSWORD as string,
    // Gmail requires the From address to match the authenticated account, so
    // always derive it from GMAIL_USER (only the display name is customizable).
    from: `${process.env.MAIL_FROM_NAME ?? "MediNex+"} <${process.env.GMAIL_USER}>`,
  },
});
