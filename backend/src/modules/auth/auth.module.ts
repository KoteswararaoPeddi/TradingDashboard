import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { MailModule } from "../mail/mail.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

// JwtModule.register({}) — secrets/TTLs are passed per-sign in AuthService
// (separate access/refresh secrets), so no module-level secret is set here.
@Module({
  imports: [PassportModule, JwtModule.register({}), MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
