import { SurveySection } from './survey-section.entity';
export declare enum SurveyStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    CLOSED = "closed",
    ARCHIVED = "archived"
}
export declare enum SurveyContextType {
    LEARNER = "learner",
    CENTER = "center",
    TEACHER = "teacher",
    SELF = "self",
    NONE = "none"
}
export declare class Survey {
    surveyId: string;
    tenantId: string;
    surveyTitle: string;
    surveyDescription: string;
    status: SurveyStatus;
    surveyType: string;
    settings: Record<string, any>;
    theme: Record<string, any>;
    targetRoles: string[] | null;
    contextType: SurveyContextType;
    createdBy: string;
    updatedBy: string;
    version: number;
    sections: SurveySection[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date;
    closedAt: Date;
}
