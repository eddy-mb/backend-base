import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_CONFIG } from '../../constants/usuarios.constants';

export class CrearUsuarioDto {
  @ApiProperty({
    description: 'Email único del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description:
      'Contraseña del usuario (mín 8 caracteres, debe incluir mayúscula, minúscula, número y carácter especial)',
    example: 'MiPassword123!',
    minLength: PASSWORD_CONFIG.MIN_LENGTH,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(PASSWORD_CONFIG.MIN_LENGTH, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(PASSWORD_CONFIG.REGEX, {
    message:
      'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial',
  })
  password: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Carlos',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;
}
