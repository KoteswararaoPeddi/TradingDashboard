import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { AppConfig } from "../../config/config.types";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly isProd: boolean;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const mail = this.config.get("mail", { infer: true });
    this.from = mail.from;
    this.isProd = this.config.get("nodeEnv", { infer: true }) === "production";
    // Gmail SMTP via an App Password. Swap this transport for a transactional
    // provider (SES/SendGrid/Resend) in production — only this file changes.
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: mail.user, pass: mail.appPassword },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    // Dev convenience: always log the code so the flow is testable before real
    // Gmail credentials are configured.
    if (!this.isProd) {
      this.logger.log(`OTP for ${to} → ${otp} (valid 10 minutes)`);
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: "Your MediNex+ verification code",
        text: `Your MediNex+ verification code is ${otp}. It expires in 10 minutes.`,
        html: this.otpHtml(otp),
      });
      this.logger.log(`OTP email sent to ${to}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      // In dev, don't fail the request — the console OTP above still works.
      if (this.isProd) {
        this.logger.error(`Failed to send OTP email to ${to}: ${message}`);
        throw err;
      }
      this.logger.warn(
        `Email send failed (dev) for ${to}: ${message}. Use the console OTP above.`,
      );
    }
  }

  // Notifies the business inbox (GMAIL_USER) of a new demo lead. Never throws —
  // a failed notification must not fail the demo-request submission.
  async sendDemoNotification(req: {
    fullName: string;
    hospitalName: string;
    contactNumber: string;
    email: string;
    hospitalAddress: string;
    preferredDate: string;
    preferredTime: string;
  }): Promise<void> {
    const to = this.config.get("mail", { infer: true }).user;
    const rows: [string, string][] = [
      ["Name", req.fullName],
      ["Hospital", req.hospitalName],
      ["Contact", req.contactNumber],
      ["Email", req.email],
      ["Address", req.hospitalAddress],
      ["Preferred", `${req.preferredDate} at ${req.preferredTime}`],
    ];
    const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;color:#0f172a">
        <h2 style="margin:0 0 12px">New demo request</h2>
        <table style="border-collapse:collapse">${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0;font-weight:600">${v}</td></tr>`,
          )
          .join("")}</table>
      </div>`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: `New demo request — ${req.hospitalName}`,
        text: `${req.fullName} (${req.hospitalName}) requested a demo. ${req.email} · ${req.contactNumber}. Preferred ${req.preferredDate} at ${req.preferredTime}. Address: ${req.hospitalAddress}.`,
        html,
      });
      this.logger.log(`Demo notification sent for ${req.email}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      this.logger.warn(`Demo notification email failed for ${req.email}: ${message}`);
    }
  }

  private otpHtml(otp: string): string {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:32px;color:#0f172a">
        <h2 style="margin:0 0 8px">Verify your email</h2>
        <p style="color:#475569;margin:0 0 24px">Enter this 6-digit code to finish creating your MediNex+ account.</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#7c3aed;text-align:center;padding:16px;background:#f5f3ff;border-radius:12px">${otp}</div>
        <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`;
  }
}
