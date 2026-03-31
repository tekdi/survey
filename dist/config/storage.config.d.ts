declare const _default: (() => {
    provider: string;
    s3: {
        endpoint: string | undefined;
        region: string;
        bucket: string;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        presignedUrlTtl: number;
    };
    local: {
        uploadPath: string;
        publicUrl: string;
    };
    limits: {
        image: {
            maxSize: number;
            allowedMimeTypes: string[];
        };
        video: {
            maxSize: number;
            allowedMimeTypes: string[];
        };
    };
    imageProcessing: {
        thumbnail: {
            enabled: boolean;
            width: number;
            height: number;
            quality: number;
        };
        compression: {
            enabled: boolean;
            quality: number;
        };
    };
    videoProcessing: {
        thumbnail: {
            enabled: boolean;
            timeOffset: number;
        };
    };
    virusScan: {
        enabled: boolean;
        provider: string;
        endpoint: string | undefined;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    provider: string;
    s3: {
        endpoint: string | undefined;
        region: string;
        bucket: string;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        presignedUrlTtl: number;
    };
    local: {
        uploadPath: string;
        publicUrl: string;
    };
    limits: {
        image: {
            maxSize: number;
            allowedMimeTypes: string[];
        };
        video: {
            maxSize: number;
            allowedMimeTypes: string[];
        };
    };
    imageProcessing: {
        thumbnail: {
            enabled: boolean;
            width: number;
            height: number;
            quality: number;
        };
        compression: {
            enabled: boolean;
            quality: number;
        };
    };
    videoProcessing: {
        thumbnail: {
            enabled: boolean;
            timeOffset: number;
        };
    };
    virusScan: {
        enabled: boolean;
        provider: string;
        endpoint: string | undefined;
    };
}>;
export default _default;
