import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import type { Response, Request } from 'express';

enum PrismaErrorCodes {
  UNIQUE_CONSTRAINT_VIOLATION = 'P2002',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'P2003',
  RECORD_NOT_FOUND = 'P2005',
}

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const { request, response } = this.getHttpContext(host);
    const { statusCode, message } = this.mapPrismaErrorToHttp(exception);

    this.logError(exception);
    this.sendErrorResponse(response, statusCode, message, request.url);
  }

  private getHttpContext(host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    return {
      request: ctx.getRequest<Request>(),
      response: ctx.getResponse<Response>(),
    };
  }

  private mapPrismaErrorToHttp(error: PrismaClientKnownRequestError) {
    switch (error.code) {
      case PrismaErrorCodes.UNIQUE_CONSTRAINT_VIOLATION:
        return this.handleUniqueConstraintViolation(error);
      case PrismaErrorCodes.FOREIGN_KEY_CONSTRAINT_VIOLATION:
        return this.handleForeignKeyViolation(error);
      case PrismaErrorCodes.RECORD_NOT_FOUND:
        return this.handleRecordNotFound(error);
      default:
        return this.handleGenericError(error);
    }
  }

  private handleUniqueConstraintViolation(
    error: PrismaClientKnownRequestError,
  ) {
    const target = error.meta?.target as string[];

    if (
      target?.includes('followerUsername') &&
      target?.includes('followingUsername')
    ) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'User is already following this person',
      };
    }

    if (target?.includes('username')) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Username already exists',
      };
    }

    if (target?.includes('email')) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Email already exists',
      };
    }

    return {
      statusCode: HttpStatus.CONFLICT,
      message: 'Unique constraint violation',
    };
  }

  private handleForeignKeyViolation(error: PrismaClientKnownRequestError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'One or more referenced records do not exist',
    };
  }

  private handleRecordNotFound(error: PrismaClientKnownRequestError) {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Record not found',
    };
  }

  private handleGenericError(error: PrismaClientKnownRequestError) {
    this.logger.error('Unhandled Prisma error:', error.code, error.message);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database operation failed',
    };
  }

  private logError(error: PrismaClientKnownRequestError) {
    this.logger.error(`Prisma Error [${error.code}]:`, {
      message: error.message,
      meta: error.meta,
    });
  }

  private sendErrorResponse(
    response: Response,
    statusCode: number,
    message: string,
    path: string,
  ) {
    const errorResponse = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path,
    };

    response.status(statusCode).json(errorResponse);
  }
}
