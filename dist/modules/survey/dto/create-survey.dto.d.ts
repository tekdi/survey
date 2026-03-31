import { FieldType } from '../entities/survey-field.entity';
import { SurveyContextType } from '../entities/survey.entity';
export declare class CreateFieldDto {
    field_name: string;
    field_label: string;
    field_type: FieldType;
    is_required?: boolean;
    display_order?: number;
    placeholder?: string;
    help_text?: string;
    default_value?: any;
    validations?: Record<string, any>;
    data_source?: Record<string, any>;
    upload_config?: Record<string, any>;
    ui_config?: Record<string, any>;
    conditional_logic?: Record<string, any>;
}
export declare class CreateSectionDto {
    section_title: string;
    section_description?: string;
    display_order?: number;
    is_visible?: boolean;
    conditional_logic?: Record<string, any>;
    fields?: CreateFieldDto[];
}
export declare class CreateSurveyDto {
    survey_title: string;
    survey_description?: string;
    survey_type?: string;
    settings?: Record<string, any>;
    theme?: Record<string, any>;
    target_roles?: string[];
    context_type?: SurveyContextType;
    sections?: CreateSectionDto[];
}
