export declare class SurveyFileUpload {
    fileId: string;
    tenantId: string;
    surveyId: string;
    responseId: string;
    fieldId: string;
    originalFilename: string;
    storedFilename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileType: 'image' | 'video';
    imageWidth: number;
    imageHeight: number;
    imageThumbnailPath: string | null;
    videoDuration: number;
    videoThumbnailPath: string;
    status: 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted';
    processingError: string;
    uploadedBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
