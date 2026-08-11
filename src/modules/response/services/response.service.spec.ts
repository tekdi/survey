import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResponseService } from './response.service';
import { SurveyResponse, ResponseStatus } from '../entities/survey-response.entity';
import { SurveyService } from '@/modules/survey/services/survey.service';
import { SurveyStatus, SurveyContextType, SurveyEntryType } from '@/modules/survey/entities/survey.entity';
import { KafkaService } from '@/kafka/kafka.service';
import { LoggerService } from '@/common/logger/logger.service';

describe('ResponseService.create — single/multi entry behavior', () => {
  let service: ResponseService;
  let responseRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let surveyService: { getSurveyWithRelations: jest.Mock };

  const baseSurvey = {
    surveyId: 'survey-1',
    status: SurveyStatus.PUBLISHED,
    endDate: null,
    contextType: SurveyContextType.LEARNER,
    settings: {},
  };

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }) as any;

  beforeEach(async () => {
    responseRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ responseId: 'new-response-id', ...data })),
    };
    surveyService = { getSurveyWithRelations: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseService,
        { provide: getRepositoryToken(SurveyResponse), useValue: responseRepo },
        { provide: SurveyService, useValue: surveyService },
        { provide: KafkaService, useValue: { publishResponseEvent: jest.fn().mockResolvedValue(undefined) } },
        { provide: LoggerService, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get(ResponseService);
  });

  it('resumes an existing IN_PROGRESS response instead of creating a new one (single entry)', async () => {
    surveyService.getSurveyWithRelations.mockResolvedValue({ ...baseSurvey, surveyType: SurveyEntryType.SINGLE });
    const existingInProgress = { responseId: 'in-progress-1', status: ResponseStatus.IN_PROGRESS };
    responseRepo.findOne.mockResolvedValueOnce(existingInProgress); // in-progress lookup

    const response = mockResponse();
    await service.create({} as any, 'tenant-1', 'user-1', { surveyId: 'survey-1', contextId: 'learner-1' } as any, response);

    expect(responseRepo.save).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ result: existingInProgress })
    );
  });

  it('resumes an existing IN_PROGRESS response instead of creating a new one (multi entry)', async () => {
    surveyService.getSurveyWithRelations.mockResolvedValue({ ...baseSurvey, surveyType: SurveyEntryType.MULTI });
    const existingInProgress = { responseId: 'in-progress-2', status: ResponseStatus.IN_PROGRESS };
    responseRepo.findOne.mockResolvedValueOnce(existingInProgress);

    const response = mockResponse();
    await service.create({} as any, 'tenant-1', 'user-1', { surveyId: 'survey-1', contextId: 'learner-1' } as any, response);

    expect(responseRepo.save).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('single entry: blocks creating a new response when a SUBMITTED one already exists and no IN_PROGRESS row exists', async () => {
    surveyService.getSurveyWithRelations.mockResolvedValue({ ...baseSurvey, surveyType: SurveyEntryType.SINGLE });
    responseRepo.findOne
      .mockResolvedValueOnce(null) // in-progress lookup: none
      .mockResolvedValueOnce({ responseId: 'submitted-1', status: ResponseStatus.SUBMITTED }); // submitted lookup: exists

    const response = mockResponse();
    await service.create({} as any, 'tenant-1', 'user-1', { surveyId: 'survey-1', contextId: 'learner-1' } as any, response);

    expect(responseRepo.save).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ errmsg: 'You have already submitted a response to this survey' }),
      })
    );
  });

  it('multi entry: creates a new response even when a SUBMITTED one already exists, when no IN_PROGRESS row exists', async () => {
    surveyService.getSurveyWithRelations.mockResolvedValue({ ...baseSurvey, surveyType: SurveyEntryType.MULTI });
    responseRepo.findOne.mockResolvedValueOnce(null); // in-progress lookup: none
    // no submitted-lookup call is expected for multi entry — see assertion below

    const response = mockResponse();
    await service.create({} as any, 'tenant-1', 'user-1', { surveyId: 'survey-1', contextId: 'learner-1' } as any, response);

    expect(responseRepo.findOne).toHaveBeenCalledTimes(1); // only the in-progress lookup, no submitted-duplicate check
    expect(responseRepo.save).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(201);
  });
});

describe('ResponseService.findAllBySurvey — status filter', () => {
  let service: ResponseService;
  let responseRepo: { findAndCount: jest.Mock };

  beforeEach(async () => {
    responseRepo = { findAndCount: jest.fn().mockResolvedValue([[], 0]) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseService,
        { provide: getRepositoryToken(SurveyResponse), useValue: responseRepo },
        { provide: SurveyService, useValue: {} },
        { provide: KafkaService, useValue: {} },
        { provide: LoggerService, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();
    service = module.get(ResponseService);
  });

  it('passes status through to the where clause when provided', async () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await service.findAllBySurvey(
      {} as any,
      'tenant-1',
      'survey-1',
      { contextIds: ['learner-1'], status: ResponseStatus.SUBMITTED },
      response,
    );

    expect(responseRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: ResponseStatus.SUBMITTED }),
      }),
    );
  });

  it('omits status from the where clause when not provided', async () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await service.findAllBySurvey({} as any, 'tenant-1', 'survey-1', {}, response);

    const whereArg = responseRepo.findAndCount.mock.calls[0][0].where;
    expect(whereArg).not.toHaveProperty('status');
  });
});

describe('ResponseService — cohort aggregates (multi-entry counting)', () => {
  let service: ResponseService;
  let queryBuilderMock: any;
  let responseRepo: any;

  beforeEach(async () => {
    queryBuilderMock = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    responseRepo = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseService,
        { provide: getRepositoryToken(SurveyResponse), useValue: responseRepo },
        { provide: SurveyService, useValue: {} },
        { provide: KafkaService, useValue: {} },
        { provide: LoggerService, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();
    service = module.get(ResponseService);
  });

  it('getResponseListByCohort returns a submittedCount per learner (multi-entry aware)', async () => {
    queryBuilderMock.getRawMany.mockResolvedValue([
      { contextId: 'learner-1', submittedCount: '3', hasInProgress: false, latestSubmittedAt: '2026-07-14T16:10:00.000Z' },
      { contextId: 'learner-2', submittedCount: '0', hasInProgress: true, latestSubmittedAt: null },
    ]);

    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await service.getResponseListByCohort({} as any, 'tenant-1', 'survey-1', 'batch-1', response);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: [
          { contextId: 'learner-1', submittedCount: 3, hasInProgress: false, latestSubmittedAt: '2026-07-14T16:10:00.000Z' },
          { contextId: 'learner-2', submittedCount: 0, hasInProgress: true, latestSubmittedAt: null },
        ],
      }),
    );
  });

  it('getStats cohort branch counts a learner as completed once regardless of entry count', async () => {
    queryBuilderMock.getRawMany.mockResolvedValue([
      { contextId: 'learner-1', submittedCount: '3', hasInProgress: false, latestSubmittedAt: '2026-07-14T16:10:00.000Z' },
      { contextId: 'learner-2', submittedCount: '0', hasInProgress: true, latestSubmittedAt: null },
      { contextId: 'learner-3', submittedCount: '1', hasInProgress: false, latestSubmittedAt: '2026-07-01T10:00:00.000Z' },
    ]);

    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await service.getStats({} as any, 'tenant-1', 'survey-1', response, 'batch-1');

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ result: { completed: 2, inProgress: 1 } }),
    );
  });
});
