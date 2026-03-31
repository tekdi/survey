import { Response } from 'express';
export interface Params {
    resmsgid: string;
    err?: any;
    status: string;
    errmsg?: any;
    successmessage?: string;
}
export declare class APIResponse {
    static success<T>(response: Response, apiId: string, result: T, statusCode: number, successMessage: string): any;
    static error(response: Response, apiId: string, errmsg: string, error: string, statusCode: number): any;
}
