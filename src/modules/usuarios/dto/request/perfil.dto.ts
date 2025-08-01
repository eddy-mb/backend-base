import {
  IsOptional,
  IsString,
  MaxLength,
  IsPhoneNumber,
  IsDateString,
  IsObject,
  IsIn,
  IsTimeZone,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ConfiguracionUsuario } from '../../interfaces/usuario.interface';

export class CrearPerfilDto {
  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @MaxLength(100, { message: 'Los apellidos no pueden exceder 100 caracteres' })
  apellidos?: string;

  @ApiProperty({
    description: 'Número de teléfono del usuario',
    example: '+59176543210',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('BO', { message: 'El teléfono debe ser válido para Bolivia' })
  telefono?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del usuario',
    example: '1990-05-15',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de nacimiento debe ser una fecha válida' },
  )
  fechaNacimiento?: Date | null;

  @ApiProperty({
    description: 'Biografía o descripción personal',
    example: 'Desarrollador de software con 5 años de experiencia',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La biografía debe ser una cadena de texto' })
  @MaxLength(500, { message: 'La biografía no puede exceder 500 caracteres' })
  biografia?: string;

  @ApiProperty({
    description: 'Idioma preferido',
    example: 'es',
    enum: ['es', 'en'],
    required: false,
  })
  @IsOptional()
  @IsIn(['es', 'en'], { message: 'El idioma debe ser "es" o "en"' })
  idioma?: string;

  @ApiProperty({
    description: 'Zona horaria preferida',
    example: 'America/La_Paz',
    required: false,
  })
  @IsOptional()
  @IsTimeZone({ message: 'Debe ser una zona horaria válida' })
  zonaHoraria?: string;
}

export class ActualizarPerfilDto {
  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @MaxLength(100, { message: 'Los apellidos no pueden exceder 100 caracteres' })
  apellidos?: string;

  @ApiProperty({
    description: 'Número de teléfono del usuario',
    example: '+59176543210',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('BO', { message: 'El teléfono debe ser válido para Bolivia' })
  telefono?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del usuario',
    example: '1990-05-15',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de nacimiento debe ser una fecha válida' },
  )
  fechaNacimiento?: Date;

  @ApiProperty({
    description: 'Biografía o descripción personal',
    example: 'Desarrollador de software con 5 años de experiencia',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La biografía debe ser una cadena de texto' })
  @MaxLength(500, { message: 'La biografía no puede exceder 500 caracteres' })
  biografia?: string;

  @ApiProperty({
    description: 'Configuraciones personalizadas del usuario',
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Las configuraciones deben ser un objeto válido' })
  @Type(() => Object)
  configuraciones?: ConfiguracionUsuario;

  @ApiProperty({
    description: 'Zona horaria preferida',
    example: 'America/La_Paz',
    required: false,
  })
  @IsOptional()
  @IsTimeZone({ message: 'Debe ser una zona horaria válida' })
  zonaHoraria?: string;

  @ApiProperty({
    description: 'Idioma preferido',
    example: 'es',
    enum: ['es', 'en'],
    required: false,
  })
  @IsOptional()
  @IsIn(['es', 'en'], { message: 'El idioma debe ser "es" o "en"' })
  idioma?: string;
}
