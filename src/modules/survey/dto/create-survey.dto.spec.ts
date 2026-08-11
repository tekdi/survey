import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateSurveyDto } from './create-survey.dto';

describe('CreateSurveyDto survey_type validation', () => {
  it('accepts "single"', async () => {
    const dto = plainToInstance(CreateSurveyDto, {
      survey_title: 'Test Survey',
      survey_type: 'single',
    });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'survey_type')).toHaveLength(0);
  });

  it('accepts "multi"', async () => {
    const dto = plainToInstance(CreateSurveyDto, {
      survey_title: 'Test Survey',
      survey_type: 'multi',
    });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'survey_type')).toHaveLength(0);
  });

  it('rejects an arbitrary free-text value', async () => {
    const dto = plainToInstance(CreateSurveyDto, {
      survey_title: 'Test Survey',
      survey_type: 'feedback',
    });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'survey_type')).toHaveLength(1);
  });

  it('allows survey_type to be omitted', async () => {
    const dto = plainToInstance(CreateSurveyDto, {
      survey_title: 'Test Survey',
    });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'survey_type')).toHaveLength(0);
  });
});
