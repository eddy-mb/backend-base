import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsEnum,
} from 'class-validator';
import { EstadoRol } from '../enums/autorizacion.enums';

export class CrearRolDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, {
    message: 'El código debe contener solo letras mayúsculas y guiones bajos',
  })
  codigo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(EstadoRol)
  @IsOptional()
  estado?: EstadoRol;
}

export class ActualizarRolDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(EstadoRol)
  @IsOptional()
  estado?: EstadoRol;
}

export class CambiarEstadoRolDto {
  @IsEnum(EstadoRol)
  estado: EstadoRol;
}
