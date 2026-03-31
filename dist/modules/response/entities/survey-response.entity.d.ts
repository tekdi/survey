export declare enum ResponseStatus {
    IN_PROGRESS = "in_progress",
    SUBMITTED = "submitted",
    REVIEWED = "reviewed"
}
export declare class SurveyResponse {
    responseId: string;
    tenantId: string;
    surveyId: string;
    respondentId: string;
    contextType: string | null;
    contextId: string | null;
    status: ResponseStatus;
    responseData: Record<string, any>;
    responseMetadata: {
        userAgent?: string;
        ipAddress?: string;
        startedAt?: string;
        completedAt?: string;
        timeSpentSeconds?: number;
        pageHistory?: string[];
        deviceType?: string;
    };
    fileUploadIds: Record<string, string[]>;
    submissionVersion: number;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    submittedAt: Date;
}
