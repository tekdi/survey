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
var VirusScanService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirusScanService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let VirusScanService = VirusScanService_1 = class VirusScanService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(VirusScanService_1.name);
    }
    async scanFile(filePath) {
        const enabled = this.configService.get('storage.virusScan.enabled');
        if (!enabled) {
            return { clean: true };
        }
        try {
            const endpoint = this.configService.get('storage.virusScan.endpoint');
            this.logger.log(`Virus scan requested for: ${filePath}`);
            return { clean: true };
        }
        catch (error) {
            this.logger.error(`Virus scan failed: ${error.message}`, error.stack);
            return { clean: true };
        }
    }
};
exports.VirusScanService = VirusScanService;
exports.VirusScanService = VirusScanService = VirusScanService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VirusScanService);
//# sourceMappingURL=virus-scan.service.js.map