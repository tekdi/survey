import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export class APIResponse {
  /**
   * Standard success response matching user-microservice format
   */
  public static success<T>(
    response: Response,
    apiId: string,
    result: T,
    statusCode: number,
    successMessage: string,
  ) {
    return response.status(statusCode).json({
      id: apiId,
      ver: '1.0',
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv4(),
        status: 'successful',
        err: null,
        errmsg: null,
        successmessage: successMessage,
      },
      responseCode: statusCode,
      result,
    });
  }

  /**
   * Standard error response matching user-microservice format
   */
  public static error(
    response: Response,
    apiId: string,
    errmsg: string,
    error: string,
    statusCode: number,
  ) {
    return response.status(statusCode).json({
      id: apiId,
      ver: '1.0',
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv4(),
        status: 'failed',
        err: error,
        errmsg: errmsg,
        successmessage: null,
      },
      responseCode: statusCode,
      result: {},
    });
  }
}
