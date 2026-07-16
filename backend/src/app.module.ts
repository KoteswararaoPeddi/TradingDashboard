import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import configuration from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { PrismaModule } from "./prisma/prisma.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { TradesModule } from "./modules/trades/trades.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv, // app refuses to boot on invalid env
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AccountsModule,
    TradesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // basic rate limiting
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
