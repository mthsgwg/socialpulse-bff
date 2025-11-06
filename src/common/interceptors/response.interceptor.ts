import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

interface HttpContext {
  request: any;
  response: any;
}

enum HttpMethod {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

enum HttpStatusCode {
  CREATED = 201,
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const httpContext = this.extractHttpContext(context);

    return next
      .handle()
      .pipe(map((data) => this.processResponse(data, httpContext)));
  }

  private extractHttpContext(context: ExecutionContext): HttpContext {
    const ctx = context.switchToHttp();
    return {
      request: ctx.getRequest(),
      response: ctx.getResponse(),
    };
  }

  private processResponse(
    data: any,
    httpContext: HttpContext,
  ): StandardResponse<any> {
    if (this.isAlreadyFormatted(data)) {
      return data;
    }

    return this.formatSuccessResponse(data, httpContext);
  }

  private isAlreadyFormatted(data: any): boolean {
    return (
      data && typeof data === 'object' && this.hasRequiredResponseFields(data)
    );
  }

  private hasRequiredResponseFields(data: any): boolean {
    return 'success' in data && 'statusCode' in data;
  }

  private formatSuccessResponse(
    data: any,
    httpContext: HttpContext,
  ): StandardResponse<any> {
    const { request, response } = httpContext;

    return {
      success: true,
      statusCode: response.statusCode,
      message: this.getSuccessMessage(request.method, response.statusCode),
      data: data,
      timestamp: this.getCurrentTimestamp(),
      path: request.url,
    };
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  private getSuccessMessage(method: string, statusCode: number): string {
    const messageMap = {
      [HttpMethod.POST]: this.getPostMessage(statusCode),
      [HttpMethod.GET]: 'Data retrieved successfully',
      [HttpMethod.PUT]: 'Resource updated successfully',
      [HttpMethod.PATCH]: 'Resource updated successfully',
      [HttpMethod.DELETE]: 'Resource deleted successfully',
    };

    return messageMap[method as HttpMethod] ?? this.getDefaultMessage();
  }

  private getPostMessage(statusCode: number): string {
    return statusCode === HttpStatusCode.CREATED
      ? 'Resource created successfully'
      : 'Operation completed successfully';
  }

  private getDefaultMessage(): string {
    return 'Operation completed successfully';
  }
}
