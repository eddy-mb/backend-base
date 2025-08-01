import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { EstadoUsuario } from '../../enums/usuario.enum';

export class CambiarPasswordDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'MiPasswordAnterior123!',
  })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  passwordActual: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: 'MiNuevaPassword123!',
    minLength: 8,
  })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La nueva contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial',
  })
  passwordNuevo: string;

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña',
    example: 'MiNuevaPassword123!',
  })
  @IsString({ message: 'La confirmación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  confirmarPassword: string;
}

export class VerificarEmailDto {
  @ApiProperty({
    description: 'Token de verificación de email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;
}

export class CambiarEstadoUsuarioDto {
  @ApiProperty({
    description: 'Nuevo estado del usuario',
    enum: EstadoUsuario,
    example: EstadoUsuario.ACTIVO,
  })
  @IsEnum(EstadoUsuario, { message: 'El estado debe ser válido' })
  estado: EstadoUsuario;

  @ApiProperty({
    description: 'Motivo del cambio de estado (opcional)',
    example: 'Usuario verificado correctamente',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  motivo?: string;
}

export class FiltrosUsuarioDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Búsqueda por nombre o email',
    example: 'juan',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser una cadena de texto' })
  busqueda?: string;

  @ApiProperty({
    description: 'Filtrar por estado del usuario',
    enum: EstadoUsuario,
    required: false,
  })
  @IsOptional()
  @IsEnum(EstadoUsuario, { message: 'El estado debe ser válido' })
  estado?: EstadoUsuario;

  @ApiProperty({
    description: 'Filtrar por verificación de email',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'emailVerificado debe ser true o false' })
  emailVerificado?: boolean;

  @ApiProperty({
    description: 'Fecha de inicio para filtrar por fecha de creación',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fechaCreacionInicio?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar por fecha de creación',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  fechaCreacionFin?: string;

  @ApiProperty({
    description: 'Campo por el cual ordenar',
    example: 'fechaCreacion',
    enum: ['nombre', 'email', 'fechaCreacion', 'ultimaActividad'],
    required: false,
  })
  @IsOptional()
  @IsIn(['id', 'nombre', 'email', 'fechaCreacion', 'ultimaActividad'], {
    message: 'El campo de ordenamiento debe ser válido',
  })
  orderBy: string = 'fechaCreacion';
}
