import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly DEFAULT_ERROR_MESSAGE = 'An error occurred';

  catch(exception: unknown, host: ArgumentsHost): void {
    const { request, response } = this.getHttpContext(host);
    const { statusCode, message } = this.extractExceptionData(exception);

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

  private extractExceptionData(exception: unknown) {
    if (this.isHttpException(exception)) {
      return this.handleHttpException(exception);
    }

    if (this.isError(exception)) {
      return this.handleGenericError();
    }

    return this.handleUnknownException();
  }

  private isHttpException(exception: unknown): exception is HttpException {
    return exception instanceof HttpException;
  }

  private isError(exception: unknown): exception is Error {
    return exception instanceof Error;
  }

  private handleHttpException(exception: HttpException) {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const message = this.parseHttpExceptionMessage(exceptionResponse);

    return { statusCode, message };
  }

  private handleGenericError() {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.DEFAULT_ERROR_MESSAGE,
    };
  }

  private handleUnknownException() {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.DEFAULT_ERROR_MESSAGE,
    };
  }

  private parseHttpExceptionMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    if (this.isMessageObject(response)) {
      return this.extractMessageFromObject(response);
    }

    return this.DEFAULT_ERROR_MESSAGE;
  }

  private isMessageObject(response: unknown): response is Record<string, any> {
    return response !== null && typeof response === 'object';
  }

  private extractMessageFromObject(messageObj: Record<string, any>): string {
    if (messageObj.message) {
      return this.formatMessage(messageObj.message);
    }

    if (messageObj.error) {
      return String(messageObj.error);
    }

    return this.DEFAULT_ERROR_MESSAGE;
  }

  private formatMessage(message: unknown): string {
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return String(message);
  }

  private logError(exception: unknown): void {
    if (this.isError(exception)) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      return;
    }

    this.logger.error('Unknown exception', exception);
  }

  private sendErrorResponse(
    response: Response,
    statusCode: number,
    message: string,
    path: string,
  ): void {
    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path,
    };

    response.status(statusCode).json(errorResponse);
  }
}
