import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { Public } from "../../common/decorators/public.decorator";
import { DemoService } from "./demo.service";
import { CreateDemoRequestDto } from "./dto/create-demo-request.dto";

@Controller("demo-requests")
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() dto: CreateDemoRequestDto) {
    return {
      message: "Demo requested. Our team will reach out to confirm your slot.",
      data: await this.demo.create(dto),
    };
  }
}
