"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsDecorator = exports.Permissions = void 0;
const common_1 = require("@nestjs/common");
const Permissions = (...permissions) => (0, common_1.SetMetadata)('permissions', permissions);
exports.Permissions = Permissions;
exports.PermissionsDecorator = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.permissions;
});
//# sourceMappingURL=permission.decorator.js.map