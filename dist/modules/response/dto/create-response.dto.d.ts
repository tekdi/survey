export declare class CreateResponseDto {
    surveyId: string;
    contextId?: string;
    responseData?: Record<string, any>;
    responseMetadata?: Record<string, any>;
}
export declare class UpdateResponseDto {
    responseData?: Record<string, any>;
    fileUploadIds?: Record<string, string[]>;
    responseMetadata?: Record<string, any>;
}
export declare class SubmitResponseDto {
    responseData?: Record<string, any>;
    fileUploadIds?: Record<string, string[]>;
}
