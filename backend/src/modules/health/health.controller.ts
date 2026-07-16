import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check(): { message: string; data: { status: string; timestamp: string } } {
    return {
      message: "OK",
      data: { status: "ok", timestamp: new Date().toISOString() },
    };
  }
}
