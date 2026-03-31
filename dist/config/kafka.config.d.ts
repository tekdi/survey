declare const _default: (() => {
    kafkaEnabled: boolean;
    kafkaHost: string;
    brokers: string[];
    clientId: string;
    topic: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    kafkaEnabled: boolean;
    kafkaHost: string;
    brokers: string[];
    clientId: string;
    topic: string;
}>;
export default _default;
