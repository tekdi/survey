import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
declare const RbacJwtStrategy_base: new (...args: any[]) => Strategy;
export declare class RbacJwtStrategy extends RbacJwtStrategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(request: any, payload: any): Promise<any>;
}
export {};
