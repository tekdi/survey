declare const _default: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigins: string[];
    throttleTtl: number;
    throttleLimit: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigins: string[];
    throttleTtl: number;
    throttleLimit: number;
}>;
export default _default;
