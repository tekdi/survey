import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly apiId: string;

  constructor(apiId?: string) {
    this.apiId = apiId || 'api.survey.unknown';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Internal server error';
    let errorName = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        errorMessage = Array.isArray(resp.message)
          ? resp.message.join(', ')
          : resp.message || errorMessage;
        errorName = resp.error || exception.name;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      errorName = exception.name;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${statusCode}: ${errorMessage}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(statusCode).json({
      id: this.apiId,
      ver: '1.0',
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv4(),
        status: 'failed',
        err: errorName,
        errmsg: errorMessage,
        successmessage: null,
      },
      responseCode: statusCode,
      result: {},
    });
  }
}
