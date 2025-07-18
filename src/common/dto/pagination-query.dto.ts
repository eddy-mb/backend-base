import { IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { QUERY_DEFAULTS } from '../constants';

enum ORDER_DIRECTION {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page: number = QUERY_DEFAULTS.PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(QUERY_DEFAULTS.MAX_LIMIT)
  readonly limit: number = QUERY_DEFAULTS.LIMIT;

  @IsOptional()
  readonly orderBy?: string = QUERY_DEFAULTS.ORDER_BY;

  @IsOptional()
  @IsEnum(ORDER_DIRECTION)
  orderDirection?: 'ASC' | 'DESC' = QUERY_DEFAULTS.ORDER_DIRECTION;

  get saltar(): number {
    return (this.page - 1) * this.limit;
  }
}
