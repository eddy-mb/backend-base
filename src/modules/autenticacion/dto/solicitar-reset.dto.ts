import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitarResetDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail()
  email: string;
}
