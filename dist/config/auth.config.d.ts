declare const _default: (() => {
    keycloakRsaPublicKey: string;
    rbacJwtSecret: string;
    rbacIssuer: string;
    rbacAudience: string;
    jwtSecret: string;
    jwtExpiration: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    keycloakRsaPublicKey: string;
    rbacJwtSecret: string;
    rbacIssuer: string;
    rbacAudience: string;
    jwtSecret: string;
    jwtExpiration: number;
}>;
export default _default;
