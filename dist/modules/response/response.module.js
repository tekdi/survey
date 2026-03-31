"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const survey_response_entity_1 = require("./entities/survey-response.entity");
const response_service_1 = require("./services/response.service");
const response_controller_1 = require("./controllers/response.controller");
const survey_module_1 = require("../survey/survey.module");
const kafka_module_1 = require("../../kafka/kafka.module");
let ResponseModule = class ResponseModule {
};
exports.ResponseModule = ResponseModule;
exports.ResponseModule = ResponseModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([survey_response_entity_1.SurveyResponse]), survey_module_1.SurveyModule, kafka_module_1.KafkaModule],
        controllers: [response_controller_1.ResponseController],
        providers: [response_service_1.ResponseService],
        exports: [response_service_1.ResponseService],
    })
], ResponseModule);
//# sourceMappingURL=response.module.js.map