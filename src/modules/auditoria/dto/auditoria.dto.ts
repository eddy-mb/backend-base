import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsPositive,
  IsObject,
  IsUUID,
  IsIP,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccionAuditoria,
  AuditoriaMetadatos,
} from '../interfaces/auditoria.interface';
import { AUDITORIA_LIMITS } from '../constants/auditoria.constants';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

/**
 * DTO para crear un nuevo registro de auditoría
 */
export class CreateAuditoriaDto {
  @ApiProperty({
    description: 'Nombre de la tabla/entidad afectada',
    example: 'usuarios',
  })
  @IsString()
  @MaxLength(AUDITORIA_LIMITS.TABLA_MAX_LENGTH)
  tabla: string;

  @ApiProperty({
    description: 'Identificador del registro afectado',
    example: '123',
  })
  @IsString()
  @MaxLength(AUDITORIA_LIMITS.ID_REGISTRO_MAX_LENGTH)
  idRegistro: string;

  @ApiProperty({
    description: 'Tipo de operación realizada',
    enum: ['CREATE', 'UPDATE', 'DELETE'],
  })
  @IsEnum(['CREATE', 'UPDATE', 'DELETE'])
  accion: AccionAuditoria;

  @ApiPropertyOptional({
    description: 'ID del usuario que realizó la operación',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  usuarioId?: number;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales de la operación',
  })
  @IsOptional()
  @IsObject()
  metadatos?: AuditoriaMetadatos;
}

/**
 * DTO para consultar logs de auditoría con filtros y paginación
 */
export class AuditoriaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tabla específica',
    example: 'usuarios',
  })
  @IsOptional()
  @IsString()
  @MaxLength(AUDITORIA_LIMITS.TABLA_MAX_LENGTH)
  tabla?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de usuario',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  usuarioId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de acción',
    enum: ['CREATE', 'UPDATE', 'DELETE'],
  })
  @IsOptional()
  @IsEnum(['CREATE', 'UPDATE', 'DELETE'])
  accion?: AccionAuditoria;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'ID específico del registro',
  })
  @IsOptional()
  @IsString()
  @MaxLength(AUDITORIA_LIMITS.ID_REGISTRO_MAX_LENGTH)
  idRegistro?: string;

  @ApiPropertyOptional({
    description: 'ID de correlación para tracking',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @ApiPropertyOptional({
    description: 'Dirección IP del origen',
  })
  @IsOptional()
  @IsIP()
  ipOrigen?: string;
}
