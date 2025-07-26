import { IsNumber, IsEnum } from 'class-validator';
import { EstadoUsuarioRol } from '../enums/autorizacion.enums';

export class AsignarRolDto {
  @IsNumber()
  usuarioId: number;

  @IsNumber()
  rolId: number;
}

export class CambiarEstadoUsuarioRolDto {
  @IsEnum(EstadoUsuarioRol)
  estado: EstadoUsuarioRol;
}

export class AsignarRolesMasivoDto {
  @IsNumber()
  usuarioId: number;

  @IsNumber({}, { each: true })
  roleIds: number[];
}
