import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { AuthService } from '../services/auth.service';
import { JwtPayload, RequestUser } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configuracionService: ConfiguracionService,
    private usuarioRepository: UsuarioRepository,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuracionService.seguridad.jwtSecret,
      passReqToCallback: true, // Para acceder al request y extraer el token
    });
  }

  async validate(request: any, payload: JwtPayload): Promise<RequestUser> {
    // Extraer token del header
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    // Verificar si el token está en blacklist
    if (token) {
      const estaEnBlacklist =
        await this.authService.estaTokenEnBlacklist(token);
      if (estaEnBlacklist) {
        throw new UnauthorizedException('Token invalidado');
      }
    }

    // Verificar que el usuario existe y está activo
    const usuario = await this.usuarioRepository.buscarParaRespuesta(
      payload.sub,
    );
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!usuario.puedeIniciarSesion) {
      throw new UnauthorizedException('Usuario inactivo o no verificado');
    }

    return {
      id: usuario.id,
      email: usuario.email,
    };
  }
}
