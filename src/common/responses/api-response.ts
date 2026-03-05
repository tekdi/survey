import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Params {
  resmsgid: string;
  err?: any;
  status: string;
  errmsg?: any;
  successmessage?: string;
}

export class APIResponse {
  /**
   * Standard success response matching attendance-microservice format
   * Uses spread operator to place result properties at root level
   */
  public static success<T>(
    response: Response,
    apiId: string,
    result: T,
    statusCode: number,
    successMessage: string,
  ) {
    try {
      const params: Params = {
        resmsgid: uuidv4(),
        status: 'successful',
        err: null,
        errmsg: null,
        successmessage: successMessage,
      };

      const resObj = {
        id: apiId,
        ver: '1.0',
        ts: new Date().toISOString(),
        params,
        responseCode: statusCode,
        ...result,
      };
      return response.status(statusCode).json(resObj);
    } catch (e) {
      return e;
    }
  }

  /**
   * Standard error response matching attendance-microservice format
   */
  public static error(
    response: Response,
    apiId: string,
    errmsg: string,
    error: string,
    statusCode: number,
  ) {
    try {
      const params: Params = {
        resmsgid: uuidv4(),
        status: 'failed',
        err: error,
        errmsg: errmsg,
      };

      const resObj = {
        id: apiId,
        ver: '1.0',
        ts: new Date().toISOString(),
        params,
        responseCode: statusCode,
        result: {},
      };
      return response.status(statusCode).json(resObj);
    } catch (e) {
      return e;
    }
  }
}
