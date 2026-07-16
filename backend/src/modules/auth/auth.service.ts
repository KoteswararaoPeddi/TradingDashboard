import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Role, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "crypto";

import { AppConfig } from "../../config/config.types";
import { JwtPayload } from "../../common/types/auth-user";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { LoginDto } from "./dto/login.dto";
import { ResendOtpDto } from "./dto/resend-otp.dto";
import { SignupRequestDto } from "./dto/signup-request.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const SALT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  hospitalId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly mail: MailService,
  ) {}

  /** Step 1 — validate details, store a pending signup, email a 6-digit OTP. */
  async requestOtp(dto: SignupRequestDto): Promise<{ email: string }> {
    const email = dto.email.toLowerCase().trim();

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException("An account with this email already exists.");
    }

    const otp = this.generateOtp();
    const [otpHash, passwordHash] = await Promise.all([
      bcrypt.hash(otp, SALT_ROUNDS),
      bcrypt.hash(dto.password, SALT_ROUNDS),
    ]);

    const data = {
      otpHash,
      hospitalName: dto.hospitalName.trim(),
      adminName: dto.adminName.trim(),
      phone: dto.phone ?? null,
      passwordHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    };

    await this.prisma.signupOtp.upsert({
      where: { email },
      create: { email, ...data },
      update: data,
    });

    await this.mail.sendOtp(email, otp);
    return { email };
  }

  /** Regenerate + resend the OTP for a pending signup. */
  async resendOtp(dto: ResendOtpDto): Promise<{ email: string }> {
    const email = dto.email.toLowerCase().trim();
    const pending = await this.prisma.signupOtp.findUnique({ where: { email } });
    if (!pending) {
      throw new BadRequestException("No pending verification. Please start signup again.");
    }

    const otp = this.generateOtp();
    await this.prisma.signupOtp.update({
      where: { email },
      data: {
        otpHash: await bcrypt.hash(otp, SALT_ROUNDS),
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.mail.sendOtp(email, otp);
    return { email };
  }

  /** Step 2 — verify the OTP and create the Hospital tenant + admin User. */
  async verifyOtp(dto: VerifyOtpDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const email = dto.email.toLowerCase().trim();
    const pending = await this.prisma.signupOtp.findUnique({ where: { email } });

    if (!pending) throw new BadRequestException("No pending signup. Please start again.");
    if (pending.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("This code has expired. Please resend a new one.");
    }
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException("Too many attempts. Please resend a new code.");
    }

    if (!(await bcrypt.compare(dto.otp, pending.otpHash))) {
      await this.prisma.signupOtp.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException("Incorrect code. Please try again.");
    }

    const slug = await this.uniqueSlug(pending.hospitalName);

    const user = await this.prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: { name: pending.hospitalName, slug },
      });
      const created = await tx.user.create({
        data: {
          hospitalId: hospital.id,
          email,
          passwordHash: pending.passwordHash,
          role: Role.HOSPITAL_ADMIN,
          name: pending.adminName,
          phone: pending.phone,
        },
      });
      await tx.signupOtp.delete({ where: { email } });
      return created;
    });

    const tokens = await this.issueTokens(user);
    return { user: this.safe(user), tokens };
  }

  /** Returning user login (email + password, no OTP). */
  async login(dto: LoginDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    const tokens = await this.issueTokens(user);
    return { user: this.safe(user), tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.safe(user);
  }

  // ------------------------------------------------------------------ helpers

  private generateOtp(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const jwtCfg = this.config.get("jwt", { infer: true });
    const payload: JwtPayload = {
      sub: user.id,
      hospitalId: user.hospitalId,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: jwtCfg.accessSecret,
      expiresIn: jwtCfg.accessTtl as JwtSignOptions["expiresIn"],
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: jwtCfg.refreshSecret,
        expiresIn: jwtCfg.refreshTtl as JwtSignOptions["expiresIn"],
      },
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken: await bcrypt.hash(refreshToken, SALT_ROUNDS) },
    });

    return { accessToken, refreshToken };
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "hospital";
    let slug = `${base}-${randomBytes(3).toString("hex")}`;
    if (await this.prisma.hospital.findUnique({ where: { slug } })) {
      slug = `${base}-${randomBytes(3).toString("hex")}`;
    }
    return slug;
  }

  private safe(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
    };
  }
}
