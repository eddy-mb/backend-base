import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PoliticaService } from '../services/politica.service';
import { UsuarioRolService } from '../services/usuario-rol.service';
import { UrlMatcherUtil } from '../utils/url-matcher.util';
import { AplicacionTipo } from '../enums/autorizacion.enums';
import { JwtPayload } from '../../autenticacion/interfaces/auth.interfaces';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class AutorizacionGuard implements CanActivate {
  private readonly logger = new Logger(AutorizacionGuard.name);

  constructor(
    private reflector: Reflector,
    private politicaService: PoliticaService,
    private usuarioRolService: UsuarioRolService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const user = request.user;

      if (!user) {
        this.logger.warn('Usuario no autenticado');
        return false;
      }

      const url = this.extraerUrl(request);
      const metodo = request.method;

      const rolesUsuario =
        await this.usuarioRolService.obtenerCodigosRolesUsuario(user.sub);

      if (rolesUsuario.length === 0) {
        this.logger.warn(`Usuario ${user.sub} sin roles`);
        return false;
      }

      for (const rol of rolesUsuario) {
        const tienePermiso = await this.politicaService.verificarPermiso(
          rol,
          url,
          metodo,
          AplicacionTipo.BACKEND,
        );

        if (tienePermiso) {
          return true;
        }
      }

      this.logger.warn(`Acceso denegado para usuario ${user.sub}`);
      return false;
    } catch (error) {
      this.logger.error('Error en autorización:', error);
      return false;
    }
  }

  private extraerUrl(request: AuthenticatedRequest): string {
    const url = request.url;
    return UrlMatcherUtil.limpiarUrl(url);
  }
}
