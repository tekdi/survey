import { ConfigService } from '@nestjs/config';
export interface VideoProcessResult {
    duration: number;
    codec: string | null;
    thumbnailPath: string | null;
}
export declare class VideoProcessingService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    processVideo(filePath: string): Promise<VideoProcessResult>;
}
