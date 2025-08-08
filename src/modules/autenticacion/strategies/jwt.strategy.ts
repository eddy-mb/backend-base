import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { AuthService } from '../services/auth.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { JwtPayload } from '../interfaces/auth.interface';

/**
 * Estrategia JWT para validación de tokens de acceso
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configuracionService: ConfiguracionService,
    private readonly authService: AuthService,
    private readonly jwtTokenService: JwtTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuracionService.seguridad.jwtSecret,
      passReqToCallback: true,
    });
  }

  /**
   * Validación del payload JWT - Solo autenticación
   */
  async validate(request: any, payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token type inválido');
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (token) {
      const estaEnBlacklist = await this.jwtTokenService.estaEnBlacklist(token);
      if (estaEnBlacklist) {
        throw new UnauthorizedException('Token revocado');
      }
    }

    const usuario = await this.authService.validarUsuarioPorId(payload.sub);
    if (!usuario) {
      throw new UnauthorizedException(
        'Acceso denegado: usuario inexistente o inactivo',
      );
    }

    // Retornar solo datos de usuario autenticado (sin roles)
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
    };
  }
}
