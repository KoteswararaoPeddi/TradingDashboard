import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AppConfig } from "../../../config/config.types";
import { AuthUser, JwtPayload } from "../../../common/types/auth-user";

// Reads the access token from the httpOnly cookie and validates it.
const cookieExtractor = (req: Request): string | null => {
  const cookies = req?.cookies as Record<string, string> | undefined;
  return cookies?.access_token ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.get("jwt", { infer: true }).accessSecret,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload?.sub || !payload?.hospitalId) {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.sub,
      hospitalId: payload.hospitalId,
      role: payload.role,
    };
  }
}
