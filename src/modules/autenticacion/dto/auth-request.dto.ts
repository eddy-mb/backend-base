import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_CONFIG } from '@/modules/usuarios/constants/usuarios.constants';

/**
 * DTO para verificar email
 */
export class VerificarEmailDto {
  @ApiProperty({
    description: 'Token de verificación de email',
    example: 'abc123-def456-ghi789',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;
}

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
    description: 'Nueva contraseña',
    example: 'NuevaPassword123!',
    minLength: PASSWORD_CONFIG.MIN_LENGTH,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(PASSWORD_CONFIG.MIN_LENGTH, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(PASSWORD_CONFIG.REGEX, {
    message:
      'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial',
  })
  password: string;
}
