import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { GoogleProfile } from '../interfaces/auth.interfaces';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configuracionService: ConfiguracionService) {
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

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;

    const googleProfile: GoogleProfile = {
      id,
      email: emails?.[0].value || '',
      verified_email: emails?.[0].verified || true,
      name: name?.givenName + ' ' + name?.familyName,
      given_name: name?.givenName || '',
      family_name: name?.familyName || '',
      picture: photos?.[0]?.value || '',
    };

    done(null, googleProfile);
  }
}
