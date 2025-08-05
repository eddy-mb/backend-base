import {
  IsString,
  IsOptional,
  Matches,
  IsBoolean,
  IsIn,
  IsDateString,
} from 'class-validator';

/**
 * DTO para crear un nuevo rol
 */
export class CrearRolDto {
  @IsString()
  @Matches(/^[A-Z_]+$/, {
    message: 'El código debe contener solo letras mayúsculas y guiones bajos',
  })
  codigo: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  esSistema?: boolean = false;
}

/**
 * DTO para actualizar un rol existente
 */
export class ActualizarRolDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

/**
 * DTO para asignar rol a usuario
 */
export class AsignarRolDto {
  @IsString()
  usuarioId: string;

  @IsString()
  rolCodigo: string;

  @IsOptional()
  @IsDateString()
  fechaExpiracion?: Date;
}

/**
 * DTO para crear/eliminar/verificar política de Casbin
 */
export class CrearPoliticaDto {
  @IsString()
  rol: string;

  @IsString()
  ruta: string; // '/api/v1/usuarios/:id' o '/api/v1/*'

  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'DELETE'])
  accion: string;
}

// Alias para consistencia
export class EliminarPoliticaDto extends CrearPoliticaDto {}
export class VerificarPoliticaDto extends CrearPoliticaDto {}

/**
 * DTO para respuesta de rol
 */
export class RolResponseDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  esSistema: boolean;
  estado: string;
  fechaCreacion: Date;
  fechaModificacion: Date;
}
