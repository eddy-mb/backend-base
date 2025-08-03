import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CrearUsuarioOAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  @IsOptional()
  googleId?: string;

  @IsString()
  @IsOptional()
  oauthProvider?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
