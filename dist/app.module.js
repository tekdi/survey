"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const config_2 = require("./config");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const logger_module_1 = require("./common/logger/logger.module");
const redis_module_1 = require("./common/cache/redis.module");
const kafka_module_1 = require("./kafka/kafka.module");
const survey_module_1 = require("./modules/survey/survey.module");
const response_module_1 = require("./modules/response/response.module");
const storage_module_1 = require("./modules/storage/storage.module");
const file_upload_module_1 = require("./modules/file-upload/file-upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [config_2.appConfig, config_2.databaseConfig, config_2.storageConfig, config_2.authConfig, config_2.redisConfig, config_2.kafkaConfig],
                envFilePath: ['.env.local', '.env'],
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'public'),
                serveRoot: '/survey-builder',
                serveStaticOptions: {
                    index: ['index.html'],
                },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => [
                    {
                        ttl: configService.get('app.throttleTtl', 60000),
                        limit: configService.get('app.throttleLimit', 100),
                    },
                ],
            }),
            database_module_1.DatabaseModule,
            logger_module_1.LoggerModule,
            redis_module_1.RedisModule,
            kafka_module_1.KafkaModule,
            auth_module_1.AuthModule,
            survey_module_1.SurveyModule,
            response_module_1.ResponseModule,
            storage_module_1.StorageModule,
            file_upload_module_1.FileUploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map