// Typed shape of the application config (read via ConfigService<AppConfig, true>).
export interface AppConfig {
  nodeEnv: "development" | "production" | "test";
  port: number;
  corsOrigin: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  mail: {
    user: string;
    appPassword: string;
    from: string;
  };
}
