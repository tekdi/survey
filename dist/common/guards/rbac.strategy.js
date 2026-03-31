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
exports.RbacJwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RbacJwtStrategy = class RbacJwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-rbac') {
    constructor(configService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromHeader('rbac_token'),
            ignoreExpiration: false,
            secretOrKey: configService.get('RBAC_JWT_SECRET'),
            passReqToCallback: true,
        });
        this.configService = configService;
    }
    async validate(request, payload) {
        const requiredPermissions = request.user.requiredPermissions;
        const userPermissions = payload.userData.privileges;
        const roles = payload.userData.roles;
        if (roles.includes('admin')) {
            return payload;
        }
        if (!(payload.iss === this.configService.get('ISSUER') &&
            payload.aud === this.configService.get('AUDIENCE') &&
            userPermissions.length > 0)) {
            throw new common_1.UnauthorizedException();
        }
        const isAuthorized = requiredPermissions.every((permission) => userPermissions.includes(permission));
        if (isAuthorized) {
            return payload;
        }
        throw new common_1.UnauthorizedException();
    }
};
exports.RbacJwtStrategy = RbacJwtStrategy;
exports.RbacJwtStrategy = RbacJwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RbacJwtStrategy);
//# sourceMappingURL=rbac.strategy.js.map