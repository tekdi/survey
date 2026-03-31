export declare class LoggerService {
    private logger;
    constructor();
    log(message: string, context?: string, user?: string, level?: string): void;
    error(message: string, error?: string, context?: string, user?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
}
