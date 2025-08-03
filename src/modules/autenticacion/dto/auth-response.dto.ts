import { ApiProperty } from '@nestjs/swagger';
import { AuthUserInfo } from '../interfaces/auth.interface';

/**
 * DTO de respuesta de autenticación exitosa
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de renovación',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  tokenType: 'Bearer';

  @ApiProperty({
    description: 'Tiempo de expiración en segundos',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  usuario: AuthUserInfo;
}

/**
 * DTO de respuesta de renovación de token
 */
export class RenovarResponseDto {
  @ApiProperty({
    description: 'Nuevo token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  tokenType: 'Bearer';

  @ApiProperty({
    description: 'Tiempo de expiración en segundos',
    example: 900,
  })
  expiresIn: number;
}

/**
 * DTO de respuesta de mensaje simple
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Operación realizada exitosamente',
  })
  mensaje: string;
}
