import { Module } from "@nestjs/common";

import { AccountsModule } from "../accounts/accounts.module";
import { TradesController } from "./trades.controller";
import { TradesService } from "./trades.service";

@Module({
  // Imported for its exported AccountsService (account existence check) — never
  // reaching into another module's internals.
  imports: [AccountsModule],
  controllers: [TradesController],
  providers: [TradesService],
})
export class TradesModule {}
