"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserId = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const jwt_decode_1 = require("jwt-decode");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
});
exports.GetUserId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new common_1.UnauthorizedException('Invalid or missing token');
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        return decoded?.sub;
    }
    catch (error) {
        throw new common_1.UnauthorizedException('Invalid token');
    }
});
//# sourceMappingURL=current-user.decorator.js.map