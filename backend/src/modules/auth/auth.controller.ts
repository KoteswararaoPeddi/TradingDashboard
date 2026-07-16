import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { CookieOptions, Response } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthUser } from "../../common/types/auth-user";
import { AppConfig } from "../../config/config.types";
import { AuthService, AuthTokens } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ResendOtpDto } from "./dto/resend-otp.dto";
import { SignupRequestDto } from "./dto/signup-request.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15m
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("signup/request-otp")
  async requestOtp(@Body() dto: SignupRequestDto) {
    const { email } = await this.auth.requestOtp(dto);
    return { message: "Verification code sent to your email.", data: { email } };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("signup/resend-otp")
  async resendOtp(@Body() dto: ResendOtpDto) {
    const { email } = await this.auth.resendOtp(dto);
    return { message: "A new code has been sent.", data: { email } };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("signup/verify")
  async verify(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.verifyOtp(dto);
    this.setAuthCookies(res, tokens);
    return { message: "Account created.", data: user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.login(dto);
    this.setAuthCookies(res, tokens);
    return { message: "Signed in.", data: user };
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(user.userId);
    this.clearAuthCookies(res);
    return { message: "Signed out.", data: null };
  }

  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    return { message: "OK", data: await this.auth.me(user.userId) };
  }

  // ------------------------------------------------------------------ cookies

  private cookieBase(): CookieOptions {
    const isProd = this.config.get("nodeEnv", { infer: true }) === "production";
    return { httpOnly: true, sameSite: "lax", secure: isProd, path: "/" };
  }

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    res.cookie("access_token", tokens.accessToken, {
      ...this.cookieBase(),
      maxAge: ACCESS_MAX_AGE,
    });
    res.cookie("refresh_token", tokens.refreshToken, {
      ...this.cookieBase(),
      maxAge: REFRESH_MAX_AGE,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie("access_token", this.cookieBase());
    res.clearCookie("refresh_token", this.cookieBase());
  }
}
