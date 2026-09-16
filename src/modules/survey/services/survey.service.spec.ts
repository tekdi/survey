import { SurveyService } from './survey.service';
import { PaginationDto } from '@/common/dto/pagination.dto';

describe('SurveyService.findAll — SDBV (state/district/block/village) filtering', () => {
  let service: SurveyService;
  let andWhereCalls: Array<{ sql: string; params?: Record<string, any> }>;
  let queryBuilder: any;
  let surveyRepo: { createQueryBuilder: jest.Mock };

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }) as any;

  beforeEach(() => {
    andWhereCalls = [];
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn((sql: string, params?: Record<string, any>) => {
        andWhereCalls.push({ sql, params });
        return queryBuilder;
      }),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    surveyRepo = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };

    service = new SurveyService(
      surveyRepo as any,
      {} as any, // sectionRepo
      {} as any, // fieldRepo
      {} as any, // dataSource
      {} as any, // kafkaService
      { log: jest.fn(), error: jest.fn() } as any, // loggerService
      {} as any, // dataSourceService
      {} as any, // excelImportService
    );
  });

  const runFindAll = (filters: PaginationDto['filters']) =>
    service.findAll({} as any, 'tenant-1', { filters } as PaginationDto, mockResponse());

  it('adds no SDBV conditions when targetGeo filter is omitted', async () => {
    await runFindAll({});
    expect(andWhereCalls.some((c) => c.sql.includes('targetGeo'))).toBe(false);
  });

  it('adds a wildcard-or-match condition for stateId only, when only targetGeo.stateId is provided (admin, state-level query)', async () => {
    await runFindAll({ targetGeo: { stateId: 'state-1' } });
    const call = andWhereCalls.find((c) => c.sql.includes(`'stateId'`));
    expect(call).toBeDefined();
    expect(call!.sql).toContain(`survey."targetGeo"->>'stateId' IS NULL`);
    expect(call!.sql).toContain(`survey."targetGeo"->>'stateId' = :stateId`);
    expect(call!.params).toEqual({ stateId: 'state-1' });
    expect(andWhereCalls.some((c) => c.sql.includes(`'districtId'`))).toBe(false);
    expect(andWhereCalls.some((c) => c.sql.includes(`'blockId'`))).toBe(false);
    expect(andWhereCalls.some((c) => c.sql.includes(`'villageId'`))).toBe(false);
  });

  it('adds one condition per level for a full SDBV query (learner flow)', async () => {
    await runFindAll({
      targetGeo: {
        stateId: 'state-1',
        districtId: 'district-1',
        blockId: 'block-1',
        villageId: 'village-1',
      },
    });

    const stateCall = andWhereCalls.find((c) => c.sql.includes(`'stateId'`));
    const districtCall = andWhereCalls.find((c) => c.sql.includes(`'districtId'`));
    const blockCall = andWhereCalls.find((c) => c.sql.includes(`'blockId'`));
    const villageCall = andWhereCalls.find((c) => c.sql.includes(`'villageId'`));

    expect(stateCall!.params).toEqual({ stateId: 'state-1' });
    expect(districtCall!.params).toEqual({ districtId: 'district-1' });
    expect(blockCall!.params).toEqual({ blockId: 'block-1' });
    expect(villageCall!.params).toEqual({ villageId: 'village-1' });
  });
});
