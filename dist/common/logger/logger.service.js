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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const winston = require("winston");
let LoggerService = class LoggerService {
    constructor() {
        const customFormat = winston.format.printf(({ timestamp, level, message, context, user, error }) => {
            return JSON.stringify({
                timestamp: timestamp,
                context: context,
                user: user,
                level: level,
                message: message,
                error: error,
            });
        });
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), customFormat),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'error.log', level: 'error' }),
                new winston.transports.File({ filename: 'combined.log' }),
            ],
        });
    }
    log(message, context, user, level = 'info') {
        this.logger.log({
            level: level,
            message: message,
            context: context,
            user: user,
            timestamp: new Date().toISOString(),
        });
    }
    error(message, error, context, user) {
        this.logger.error({
            message: message,
            error: error,
            context: context,
            user: user,
        });
    }
    warn(message, context) {
        this.logger.warn({ message, context });
    }
    debug(message, context) {
        this.logger.debug({ message, context });
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LoggerService);
//# sourceMappingURL=logger.service.js.map