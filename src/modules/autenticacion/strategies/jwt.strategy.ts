import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { AuthService } from '../services/auth.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { JwtPayload } from '../interfaces/auth.interface';
import { Usuario } from '../../usuarios/entities/usuario.entity';

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
      passReqToCallback: true, // Para acceder al request en validate
    });
  }

  /**
   * Validación del payload JWT
   * Se ejecuta automáticamente cuando se valida un token
   */
  async validate(request: any, payload: JwtPayload): Promise<Usuario> {
    // Verificar que sea un access token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token type inválido');
    }

    // Extraer token del header para verificar blacklist
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    if (token) {
      const estaEnBlacklist = await this.jwtTokenService.estaEnBlacklist(token);
      if (estaEnBlacklist) {
        throw new UnauthorizedException('Token revocado');
      }
    }

    // Validar usuario usando AuthService
    const usuario = await this.authService.validarUsuarioPorId(payload.sub);

    if (!usuario) {
      throw new UnauthorizedException('Usuario no válido o inactivo');
    }

    // El usuario se agrega automáticamente al request.user
    return usuario;
  }
}
