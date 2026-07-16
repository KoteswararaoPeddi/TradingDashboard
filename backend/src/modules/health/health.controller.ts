import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @ApiOperation({ summary: "Liveness check" })
  @ApiOkResponse({
    description: "The API is up.",
    schema: {
      example: {
        success: true,
        message: "OK",
        data: { status: "ok", timestamp: "2026-07-16T09:20:00.000Z" },
      },
    },
  })
  @Get()
  check(): { message: string; data: { status: string; timestamp: string } } {
    return {
      message: "OK",
      data: { status: "ok", timestamp: new Date().toISOString() },
    };
  }
}
