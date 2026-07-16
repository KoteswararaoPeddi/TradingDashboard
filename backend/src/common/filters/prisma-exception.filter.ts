import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

/**
 * Maps known Prisma errors to clean HTTP responses so a DB error never falls
 * through to a generic 500 (and never leaks the raw error to the client).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong. Please try again.";

    switch (exception.code) {
      case "P2002":
        status = HttpStatus.CONFLICT;
        message = "That value is already in use.";
        break;
      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = "Record not found.";
        break;
      default:
        this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
    }

    response.status(status).json({ success: false, message });
  }
}
