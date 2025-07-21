import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_VALIDATION } from '../constants/auth.constants';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ minLength: PASSWORD_VALIDATION.MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_VALIDATION.MIN_LENGTH)
  @Matches(PASSWORD_VALIDATION.REGEX, {
    message:
      'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial',
  })
  nuevaPassword: string;
}
