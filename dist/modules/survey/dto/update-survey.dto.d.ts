import { CreateSurveyDto } from './create-survey.dto';
import { SurveyStatus } from '../entities/survey.entity';
declare const UpdateSurveyDto_base: import("@nestjs/common").Type<Partial<CreateSurveyDto>>;
export declare class UpdateSurveyDto extends UpdateSurveyDto_base {
    status?: SurveyStatus;
}
export {};
