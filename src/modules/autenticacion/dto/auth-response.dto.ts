import { ApiProperty } from '@nestjs/swagger';
import { AuthUserInfo } from '../interfaces/auth.interface';

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

/**
 * DTO de respuesta de autenticación con cookies
 */
export class AuthCookieResponseDto {
  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  usuario?: AuthUserInfo;

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
