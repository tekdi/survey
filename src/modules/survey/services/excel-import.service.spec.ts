import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExcelImportService } from './excel-import.service';

describe('ExcelImportService — TypeOfSurvey validation', () => {
  let service: ExcelImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelImportService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(ExcelImportService);
  });

  it('accepts "single"', () => {
    expect((service as any).validateSurveyType('single')).toEqual({
      value: 'single',
      error: null,
    });
  });

  it('accepts "Multi" case-insensitively', () => {
    expect((service as any).validateSurveyType('Multi')).toEqual({
      value: 'multi',
      error: null,
    });
  });

  it('rejects an arbitrary value', () => {
    const result = (service as any).validateSurveyType('feedback');
    expect(result.value).toBeNull();
    expect(result.error).toMatch(/TypeOfSurvey must be one of: single, multi/);
  });

  it('allows an empty/missing value (no error, null value)', () => {
    expect((service as any).validateSurveyType('')).toEqual({
      value: null,
      error: null,
    });
  });
});
