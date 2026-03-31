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
exports.SurveySection = void 0;
const typeorm_1 = require("typeorm");
const survey_entity_1 = require("./survey.entity");
const survey_field_entity_1 = require("./survey-field.entity");
let SurveySection = class SurveySection {
};
exports.SurveySection = SurveySection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'sectionId' }),
    __metadata("design:type", String)
], SurveySection.prototype, "sectionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'surveyId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveySection.prototype, "surveyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenantId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveySection.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sectionTitle', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SurveySection.prototype, "sectionTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sectionDescription', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SurveySection.prototype, "sectionDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'displayOrder', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], SurveySection.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'isVisible', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SurveySection.prototype, "isVisible", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conditionalLogic', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SurveySection.prototype, "conditionalLogic", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => survey_entity_1.Survey, (survey) => survey.sections, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'surveyId' }),
    __metadata("design:type", survey_entity_1.Survey)
], SurveySection.prototype, "survey", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => survey_field_entity_1.SurveyField, (field) => field.section, { cascade: true, eager: false }),
    __metadata("design:type", Array)
], SurveySection.prototype, "fields", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'createdAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveySection.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updatedAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveySection.prototype, "updatedAt", void 0);
exports.SurveySection = SurveySection = __decorate([
    (0, typeorm_1.Entity)({ name: 'SurveySections' }),
    (0, typeorm_1.Index)('idx_section_survey', ['surveyId'])
], SurveySection);
//# sourceMappingURL=survey-section.entity.js.map