import { Request } from 'express';

/**
 * Request con usuario autenticado - Estándar industrial
 */
export interface RequestWithUser extends Request {
  user?: {
    id: string; // ID del usuario
    email: string; // Email del usuario
    roles?: string[]; // Array de códigos de rol (ej: ["ADMIN", "USER"])
    [key: string]: unknown; // Extensible para propiedades adicionales
  };
}
