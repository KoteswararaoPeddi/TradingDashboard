import { Module } from "@nestjs/common";

import { MailModule } from "../mail/mail.module";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";

@Module({
  imports: [MailModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
