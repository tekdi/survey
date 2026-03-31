"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = exports.GetTenantId = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
exports.GetTenantId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.headers['tenantid'];
    if (!tenantId) {
        throw new common_1.BadRequestException('tenantid header is required');
    }
    if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
        throw new common_1.BadRequestException('tenantid must be a non-empty string');
    }
    if (!(0, class_validator_1.isUUID)(tenantId)) {
        throw new common_1.BadRequestException('tenantid must be a valid UUID format');
    }
    return tenantId;
});
exports.Tenant = exports.GetTenantId;
//# sourceMappingURL=tenant.decorator.js.map