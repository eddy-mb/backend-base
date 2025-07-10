import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsJSON,
} from 'class-validator';
import { AuditoriaAction } from '../interfaces/auditoria.interface';

/**
 * DTO para crear un registro de auditoría
 */
export class CreateAuditoriaLogDto {
  @IsString()
  tabla: string;

  @IsString()
  idRegistro: string;

  @IsEnum(AuditoriaAction)
  accion: AuditoriaAction;

  @IsOptional()
  @IsJSON()
  valoresAnteriores?: any;

  @IsOptional()
  @IsJSON()
  valoresNuevos?: any;

  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @IsOptional()
  @IsJSON()
  metadatos?: any;
}

/**
 * DTO para respuesta de auditoría con metadatos
 */
export class AuditoriaResponseDto {
  id: number;
  tabla: string;
  idRegistro: string;
  accion: AuditoriaAction;
  valoresAnteriores?: any;
  valoresNuevos?: any;
  usuarioId?: number;
  metadatos?: any;
  fechaCreacion: Date;

  constructor(partial: Partial<AuditoriaResponseDto>) {
    Object.assign(this, partial);
  }
}
