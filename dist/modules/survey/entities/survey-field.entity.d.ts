import { SurveySection } from './survey-section.entity';
export declare enum FieldType {
    TEXT = "text",
    TEXTAREA = "textarea",
    NUMBER = "number",
    EMAIL = "email",
    PHONE = "phone",
    DATE = "date",
    TIME = "time",
    DATETIME = "datetime",
    SELECT = "select",
    MULTI_SELECT = "multi_select",
    RADIO = "radio",
    CHECKBOX = "checkbox",
    RATING = "rating",
    SCALE = "scale",
    IMAGE_UPLOAD = "image_upload",
    VIDEO_UPLOAD = "video_upload",
    FILE_UPLOAD = "file_upload",
    SIGNATURE = "signature",
    LOCATION = "location",
    MATRIX = "matrix"
}
export declare class SurveyField {
    fieldId: string;
    sectionId: string;
    surveyId: string;
    tenantId: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: FieldType;
    isRequired: boolean;
    displayOrder: number;
    placeholder: string;
    helpText: string;
    defaultValue: any;
    validations: Record<string, any>;
    dataSource: Record<string, any>;
    uploadConfig: Record<string, any>;
    uiConfig: Record<string, any>;
    conditionalLogic: Record<string, any>;
    section: SurveySection;
    createdAt: Date;
    updatedAt: Date;
}
