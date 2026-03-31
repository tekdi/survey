import { ConfigService } from '@nestjs/config';
export interface ScanResult {
    clean: boolean;
    threat?: string;
}
export declare class VirusScanService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    scanFile(filePath: string): Promise<ScanResult>;
}
