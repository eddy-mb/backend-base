import { IsString, IsNotEmpty, IsEnum, Matches } from 'class-validator';
import { AccionHttp, AplicacionTipo } from '../enums/autorizacion.enums';

export class CrearPoliticaDto {
  @IsString()
  @IsNotEmpty()
  rol: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\/(\w+\/?)+|\/(\w+\/)*\*$/, {
    message:
      'Recurso debe ser una ruta válida (/ruta/recurso) o wildcard (/ruta/*)',
  })
  recurso: string;

  @IsEnum(AccionHttp)
  accion: AccionHttp;

  @IsEnum(AplicacionTipo)
  aplicacion: AplicacionTipo;
}

export class CrearPoliticasDto {
  @IsString()
  @IsNotEmpty()
  rol: string;

  politicas: Array<{
    recurso: string;
    accion: AccionHttp;
    aplicacion: AplicacionTipo;
  }>;
}
