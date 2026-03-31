"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet = require("helmet");
const app_module_1 = require("./app.module");
const exception_filter_1 = require("./common/filters/exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use(helmet.default({
        contentSecurityPolicy: false,
    }));
    const corsOrigins = configService.get('app.corsOrigins', '*');
    app.enableCors({
        origin: corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'tenantid', 'rbac_token'],
    });
    const apiPrefix = configService.get('app.apiPrefix') || 'api/v1';
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalFilters(new exception_filter_1.AllExceptionsFilter());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Survey Service API')
        .setDescription('API for managing surveys, responses, and media uploads with multi-tenant support')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'tenantid', in: 'header' }, 'tenantid')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('swagger-docs', app, document);
    const port = configService.get('app.port') || 3000;
    await app.listen(port);
    logger.log(`Application running on port ${port}`);
    logger.log(`Swagger docs: http://localhost:${port}/swagger-docs`);
    logger.log(`Survey Builder: http://localhost:${port}/survey-builder`);
}
bootstrap();
//# sourceMappingURL=main.js.map