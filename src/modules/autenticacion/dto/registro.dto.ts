import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PASSWORD_VALIDATION } from '../constants/auth.constants';

export class RegistroDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: PASSWORD_VALIDATION.MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_VALIDATION.MIN_LENGTH, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(PASSWORD_VALIDATION.REGEX, {
    message:
      'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial',
  })
  password: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsString()
  @IsOptional()
  nombre?: string;
}
