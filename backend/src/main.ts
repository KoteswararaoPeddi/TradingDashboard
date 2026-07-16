import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AppConfig } from "./config/config.types";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";

const DOCS_PATH = "api/docs";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  // Swagger UI boots from inline scripts/styles, which helmet's default CSP blocks.
  // The API itself serves only JSON, so the docs route is the sole HTML surface —
  // exempt just that path and keep the strict policy everywhere else.
  const helmetMiddleware = helmet();
  app.use((req: { path: string }, res: unknown, next: () => void) =>
    req.path.startsWith(`/${DOCS_PATH}`)
      ? next()
      : (helmetMiddleware as unknown as (r: unknown, s: unknown, n: () => void) => void)(
          req,
          res,
          next,
        ),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Specific filter first so Prisma errors never fall through to the generic 500.
  app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());
  app.enableCors({
    origin: config.get("corsOrigin", { infer: true }),
  });
  app.setGlobalPrefix("api");
  app.enableShutdownHooks(); // clean Prisma disconnect on SIGTERM/SIGINT

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Trade Journal API")
    .setDescription(
      "Open REST API for the Trade Journal dashboard. No authentication: intended for local/personal use.",
    )
    .setVersion("1.0")
    .build();
  SwaggerModule.setup(DOCS_PATH, app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get("port", { infer: true });
  await app.listen(port);
  Logger.log(`Trade Journal API listening on http://localhost:${port}/api`, "Bootstrap");
  Logger.log(`Swagger UI at http://localhost:${port}/${DOCS_PATH}`, "Bootstrap");
}

void bootstrap();
