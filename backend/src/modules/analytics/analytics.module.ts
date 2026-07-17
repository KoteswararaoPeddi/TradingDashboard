import { Module } from "@nestjs/common";

import { AccountsModule } from "../accounts/accounts.module";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

/**
 * Analytics is derived from trades, so it depends on AccountsModule for the
 * starting balance and reads trades via the global PrismaService. The heavy
 * lifting is in the pure analytics.calculator / trades.logic, kept framework-free
 * so the 43-check oracle can pin them.
 */
@Module({
  imports: [AccountsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
