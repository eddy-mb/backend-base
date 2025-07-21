import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  usuario: {
    id: number;
    email: string;
    nombre?: string | null;
    estado: string;
    emailVerificado: boolean;
  };
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;
}

export class MensajeResponseDto {
  @ApiProperty()
  mensaje: string;
}
