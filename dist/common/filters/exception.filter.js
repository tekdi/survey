"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor(apiId) {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
        this.apiId = apiId || 'api.survey.unknown';
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorMessage = 'Internal server error';
        let errorName = 'INTERNAL_SERVER_ERROR';
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                errorMessage = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse;
                errorMessage = Array.isArray(resp.message)
                    ? resp.message.join(', ')
                    : resp.message || errorMessage;
                errorName = resp.error || exception.name;
            }
        }
        else if (exception instanceof Error) {
            errorMessage = exception.message;
            errorName = exception.name;
        }
        const logMessage = `${request.method} ${request.url} - ${statusCode}: ${errorMessage}`;
        if (statusCode >= 500) {
            this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
        }
        else if (statusCode === 404) {
            this.logger.warn(logMessage);
        }
        else {
            this.logger.warn(logMessage);
        }
        response.status(statusCode).json({
            id: this.apiId,
            ver: '1.0',
            ts: new Date().toISOString(),
            params: {
                resmsgid: (0, uuid_1.v4)(),
                status: 'failed',
                err: errorName,
                errmsg: errorMessage,
                successmessage: null,
            },
            responseCode: statusCode,
            result: {},
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [String])
], AllExceptionsFilter);
//# sourceMappingURL=exception.filter.js.map