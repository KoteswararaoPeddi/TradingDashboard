import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { CreateDemoRequestDto } from "./dto/create-demo-request.dto";

@Injectable()
export class DemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateDemoRequestDto): Promise<{ id: string }> {
    const request = await this.prisma.demoRequest.create({
      data: { ...dto, preferredDate: new Date(dto.preferredDate) },
    });
    // Notify the business inbox — never blocks the response (MailService swallows failures).
    await this.mail.sendDemoNotification(dto);
    return { id: request.id };
  }
}
