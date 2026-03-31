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
exports.SurveyField = exports.FieldType = void 0;
const typeorm_1 = require("typeorm");
const survey_section_entity_1 = require("./survey-section.entity");
var FieldType;
(function (FieldType) {
    FieldType["TEXT"] = "text";
    FieldType["TEXTAREA"] = "textarea";
    FieldType["NUMBER"] = "number";
    FieldType["EMAIL"] = "email";
    FieldType["PHONE"] = "phone";
    FieldType["DATE"] = "date";
    FieldType["TIME"] = "time";
    FieldType["DATETIME"] = "datetime";
    FieldType["SELECT"] = "select";
    FieldType["MULTI_SELECT"] = "multi_select";
    FieldType["RADIO"] = "radio";
    FieldType["CHECKBOX"] = "checkbox";
    FieldType["RATING"] = "rating";
    FieldType["SCALE"] = "scale";
    FieldType["IMAGE_UPLOAD"] = "image_upload";
    FieldType["VIDEO_UPLOAD"] = "video_upload";
    FieldType["FILE_UPLOAD"] = "file_upload";
    FieldType["SIGNATURE"] = "signature";
    FieldType["LOCATION"] = "location";
    FieldType["MATRIX"] = "matrix";
})(FieldType || (exports.FieldType = FieldType = {}));
let SurveyField = class SurveyField {
};
exports.SurveyField = SurveyField;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'fieldId' }),
    __metadata("design:type", String)
], SurveyField.prototype, "fieldId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sectionId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveyField.prototype, "sectionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'surveyId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveyField.prototype, "surveyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenantId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveyField.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fieldName', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SurveyField.prototype, "fieldName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fieldLabel', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SurveyField.prototype, "fieldLabel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fieldType', type: 'varchar', length: 30 }),
    __metadata("design:type", String)
], SurveyField.prototype, "fieldType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'isRequired', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SurveyField.prototype, "isRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'displayOrder', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], SurveyField.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'placeholder', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SurveyField.prototype, "placeholder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'helpText', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SurveyField.prototype, "helpText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'defaultValue', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SurveyField.prototype, "defaultValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validations', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], SurveyField.prototype, "validations", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dataSource', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SurveyField.prototype, "dataSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploadConfig', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SurveyField.prototype, "uploadConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uiConfig', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], SurveyField.prototype, "uiConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conditionalLogic', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SurveyField.prototype, "conditionalLogic", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => survey_section_entity_1.SurveySection, (section) => section.fields, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sectionId' }),
    __metadata("design:type", survey_section_entity_1.SurveySection)
], SurveyField.prototype, "section", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'createdAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveyField.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updatedAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveyField.prototype, "updatedAt", void 0);
exports.SurveyField = SurveyField = __decorate([
    (0, typeorm_1.Entity)({ name: 'SurveyFields' }),
    (0, typeorm_1.Index)('idx_field_section', ['sectionId']),
    (0, typeorm_1.Index)('idx_field_survey', ['surveyId'])
], SurveyField);
//# sourceMappingURL=survey-field.entity.js.map