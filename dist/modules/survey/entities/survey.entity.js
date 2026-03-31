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
exports.Survey = exports.SurveyContextType = exports.SurveyStatus = void 0;
const typeorm_1 = require("typeorm");
const survey_section_entity_1 = require("./survey-section.entity");
var SurveyStatus;
(function (SurveyStatus) {
    SurveyStatus["DRAFT"] = "draft";
    SurveyStatus["PUBLISHED"] = "published";
    SurveyStatus["CLOSED"] = "closed";
    SurveyStatus["ARCHIVED"] = "archived";
})(SurveyStatus || (exports.SurveyStatus = SurveyStatus = {}));
var SurveyContextType;
(function (SurveyContextType) {
    SurveyContextType["LEARNER"] = "learner";
    SurveyContextType["CENTER"] = "center";
    SurveyContextType["TEACHER"] = "teacher";
    SurveyContextType["SELF"] = "self";
    SurveyContextType["NONE"] = "none";
})(SurveyContextType || (exports.SurveyContextType = SurveyContextType = {}));
let Survey = class Survey {
};
exports.Survey = Survey;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'surveyId' }),
    __metadata("design:type", String)
], Survey.prototype, "surveyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenantId', type: 'uuid' }),
    __metadata("design:type", String)
], Survey.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'surveyTitle', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Survey.prototype, "surveyTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'surveyDescription', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "surveyDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 20, default: SurveyStatus.DRAFT }),
    __metadata("design:type", String)
], Survey.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'surveyType', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "surveyType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'settings', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Survey.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'theme', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Survey.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'targetRoles', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Survey.prototype, "targetRoles", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contextType', type: 'varchar', length: 30, default: SurveyContextType.NONE }),
    __metadata("design:type", String)
], Survey.prototype, "contextType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'createdBy', type: 'uuid' }),
    __metadata("design:type", String)
], Survey.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updatedBy', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'version', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Survey.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => survey_section_entity_1.SurveySection, (section) => section.survey, { cascade: true, eager: false }),
    __metadata("design:type", Array)
], Survey.prototype, "sections", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'createdAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Survey.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updatedAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Survey.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'publishedAt', type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Date)
], Survey.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'closedAt', type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Date)
], Survey.prototype, "closedAt", void 0);
exports.Survey = Survey = __decorate([
    (0, typeorm_1.Entity)({ name: 'SurveyMaster' }),
    (0, typeorm_1.Index)('idx_survey_tenant', ['tenantId']),
    (0, typeorm_1.Index)('idx_survey_status', ['status']),
    (0, typeorm_1.Index)('idx_survey_target_roles', ['targetRoles'])
], Survey);
//# sourceMappingURL=survey.entity.js.map