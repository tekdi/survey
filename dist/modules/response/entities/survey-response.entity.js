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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyResponse = exports.ResponseStatus = void 0;
const typeorm_1 = require("typeorm");
var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["IN_PROGRESS"] = "in_progress";
    ResponseStatus["SUBMITTED"] = "submitted";
    ResponseStatus["REVIEWED"] = "reviewed";
})(ResponseStatus || (exports.ResponseStatus = ResponseStatus = {}));
let SurveyResponse = class SurveyResponse {
};
exports.SurveyResponse = SurveyResponse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'responseId' }),
    __metadata("design:type", String)
], SurveyResponse.prototype, "responseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenantId', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], SurveyResponse.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'surveyId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveyResponse.prototype, "surveyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'respondentId', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SurveyResponse.prototype, "respondentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contextType', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], SurveyResponse.prototype, "contextType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contextId', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], SurveyResponse.prototype, "contextId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS }),
    __metadata("design:type", String)
], SurveyResponse.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responseData', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], SurveyResponse.prototype, "responseData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responseMetadata', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], SurveyResponse.prototype, "responseMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fileUploadIds', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], SurveyResponse.prototype, "fileUploadIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submissionVersion', type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], SurveyResponse.prototype, "submissionVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'createdBy', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SurveyResponse.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updatedBy', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SurveyResponse.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'createdAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveyResponse.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updatedAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveyResponse.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submittedAt', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SurveyResponse.prototype, "submittedAt", void 0);
exports.SurveyResponse = SurveyResponse = __decorate([
    (0, typeorm_1.Entity)({ name: 'SurveyResponses' }),
    (0, typeorm_1.Index)('idx_response_tenant', ['tenantId']),
    (0, typeorm_1.Index)('idx_response_survey', ['surveyId']),
    (0, typeorm_1.Index)('idx_response_respondent', ['respondentId']),
    (0, typeorm_1.Index)('idx_response_status', ['status']),
    (0, typeorm_1.Index)('idx_response_context', ['contextType', 'contextId'])
], SurveyResponse);
//# sourceMappingURL=survey-response.entity.js.map