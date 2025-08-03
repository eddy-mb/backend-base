import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para login con credenciales
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiPassword123!',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}

/**
 * DTO para renovar token
 */
export class RenovarTokenDto {
  @ApiProperty({
    description: 'Refresh token para renovar access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El refresh token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  refreshToken: string;
}

/**
 * DTO para solicitar recuperación de contraseña
 */
export class RecuperarPasswordDto {
  @ApiProperty({
    description: 'Email del usuario para recuperar contraseña',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
}

/**
 * DTO para confirmar nueva contraseña
 *
 * DISEÑO CORREGIDO:
 * - Frontend valida que password === confirmPassword
 * - Backend recibe SOLO la contraseña final validada
 * - Backend se enfoca en reglas de negocio y seguridad
 */
export class ConfirmarPasswordDto {
  @ApiProperty({
    description: 'Token de recuperación de contraseña',
    example: 'abc123-def456-ghi789',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña (ya validada por frontend)',
    example: 'NuevaPassword123!',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial',
  })
  password: string;

  // ✅ ELIMINADO: confirmarPassword - se maneja en frontend
}
