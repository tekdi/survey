declare const _default: (() => {
    host: string;
    port: number;
    password: string | undefined;
    ttl: number;
    maxRetriesPerRequest: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string | undefined;
    ttl: number;
    maxRetriesPerRequest: number;
}>;
export default _default;
