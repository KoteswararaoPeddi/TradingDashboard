import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AppConfig } from "./config/config.types";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Specific filter first so Prisma errors never fall through to the generic 500.
  app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());
  app.enableCors({
    origin: config.get("corsOrigin", { infer: true }),
  });
  app.setGlobalPrefix("api");
  app.enableShutdownHooks(); // clean Prisma disconnect on SIGTERM/SIGINT

  const port = config.get("port", { infer: true });
  await app.listen(port);
  Logger.log(`Trade Journal API listening on http://localhost:${port}/api`, "Bootstrap");
}

void bootstrap();
