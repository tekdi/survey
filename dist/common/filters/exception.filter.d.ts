import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    private readonly apiId;
    constructor(apiId?: string);
    catch(exception: unknown, host: ArgumentsHost): void;
}
