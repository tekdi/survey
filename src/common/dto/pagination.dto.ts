import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TargetGeoFilterDto {
  @ApiPropertyOptional({ description: 'State id. A survey with no stateId set (open/broader) still matches.' })
  @IsOptional()
  @IsString()
  stateId?: string;

  @ApiPropertyOptional({ description: 'District id. A survey with no districtId set (state-level or broader) still matches.' })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({ description: 'Block id. A survey with no blockId set (district-level or broader) still matches.' })
  @IsOptional()
  @IsString()
  blockId?: string;

  @ApiPropertyOptional({ description: 'Village id. A survey with no villageId set (block-level or broader) still matches.' })
  @IsOptional()
  @IsString()
  villageId?: string;
}

export class FiltersDto {
  @ApiPropertyOptional({ type: [String], description: 'Filter by target roles' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @ApiPropertyOptional({ description: 'Filter by survey status (e.g. draft, published)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by context type (e.g. learner, none)' })
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional({ description: 'Filter by academic year (e.g. 2025-26)' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ type: TargetGeoFilterDto, description: 'Filter by SDBV (state/district/block/village) ids' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TargetGeoFilterDto)
  targetGeo?: TargetGeoFilterDto;
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ type: FiltersDto, description: 'Optional filters' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FiltersDto)
  filters?: FiltersDto;

  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 20);
  }
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }
}
