"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserRoles = void 0;
const common_1 = require("@nestjs/common");
const jwt_decode_1 = require("jwt-decode");
exports.GetUserRoles = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const rbacToken = request.headers['rbac_token'];
    if (!rbacToken || typeof rbacToken !== 'string') {
        return [];
    }
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(rbacToken);
        return decoded?.userData?.roles || [];
    }
    catch {
        return [];
    }
});
//# sourceMappingURL=roles.decorator.js.map