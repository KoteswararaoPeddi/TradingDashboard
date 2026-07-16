// Typed shape of the application config (read via ConfigService<AppConfig, true>).
export interface AppConfig {
  nodeEnv: "development" | "production" | "test";
  port: number;
  corsOrigin: string;
}
