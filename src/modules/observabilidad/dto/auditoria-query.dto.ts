import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditoriaAction } from '../interfaces/auditoria.interface';

/**
 * DTO para consultar logs de auditoría con filtros avanzados
 */
export class AuditoriaQueryDto {
  @IsOptional()
  @IsString()
  tabla?: string;

  @IsOptional()
  @IsString()
  idRegistro?: string;

  @IsOptional()
  @IsEnum(AuditoriaAction)
  accion?: AuditoriaAction;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  usuarioId?: number;

  @IsOptional()
  @IsDateString() // AHORA SE USA - Valida formato ISO string
  fechaDesde?: string;

  @IsOptional()
  @IsDateString() // AHORA SE USA - Valida formato ISO string
  fechaHasta?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 50;

  // Propiedades calculadas para compatibilidad con AuditoriaService
  get offset(): number {
    return ((this.page || 1) - 1) * (this.limit || 50);
  }

  get limite(): number {
    return this.limit || 50;
  }

  // Helper para convertir fechas string a Date objects
  get fechaDesdeParsed(): Date | undefined {
    return this.fechaDesde ? new Date(this.fechaDesde) : undefined;
  }

  get fechaHastaParsed(): Date | undefined {
    return this.fechaHasta ? new Date(this.fechaHasta) : undefined;
  }
}
