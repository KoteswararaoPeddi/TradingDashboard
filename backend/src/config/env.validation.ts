import { plainToInstance } from "class-transformer";
import { IsIn, IsNotEmpty, IsString, validateSync } from "class-validator";

// Boot-time env validation — the app refuses to start on missing/invalid config.
class EnvVars {
  @IsIn(["development", "production", "test"])
  NODE_ENV!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsString()
  @IsNotEmpty()
  PORT!: string;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: false });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(", "))
      .join("\n  - ");
    throw new Error(`Invalid environment variables:\n  - ${details}`);
  }

  return config;
}
