import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { GoogleProfile } from '../interfaces/auth.interface';
import { LoggerService } from '../../logging/services/logger.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configuracionService: ConfiguracionService,
    private readonly logger: LoggerService,
  ) {
    const oauthConfig = configuracionService.oauth;

    // Solo configurar si las credenciales están disponibles
    if (!oauthConfig.googleClientId || !oauthConfig.googleClientSecret) {
      console.warn(
        'Google OAuth no configurado - faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET',
      );
      // No configurar la estrategia si no hay credenciales
      return;
    }

    super({
      clientID: oauthConfig.googleClientId,
      clientSecret: oauthConfig.googleClientSecret,
      callbackURL: `${configuracionService.aplicacion.apiUrl}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(profile: Profile, done: VerifyCallback) {
    try {
      const googleProfile: GoogleProfile = {
        id: profile.id,
        email: profile.emails?.[0].value || '',
        name: profile.displayName,
        picture: profile.photos?.[0]?.value || '',
        verified_email: profile.emails?.[0].verified || false,
      };

      done(null, googleProfile);
    } catch (error) {
      this.logger.error(`Google OAuth error: ${error}`, 'GoogleStrategy');
      done(error);
    }
  }
}
