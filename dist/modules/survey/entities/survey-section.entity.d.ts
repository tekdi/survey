import { Survey } from './survey.entity';
import { SurveyField } from './survey-field.entity';
export declare class SurveySection {
    sectionId: string;
    surveyId: string;
    tenantId: string;
    sectionTitle: string;
    sectionDescription: string;
    displayOrder: number;
    isVisible: boolean;
    conditionalLogic: Record<string, any>;
    survey: Survey;
    fields: SurveyField[];
    createdAt: Date;
    updatedAt: Date;
}
