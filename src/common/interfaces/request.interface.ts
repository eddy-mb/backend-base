import { Request } from 'express';

/**
 * Request con usuario autenticado - Solo datos de autenticación
 */
export interface RequestWithUser extends Request {
  user?: {
    id: string; // ID del usuario
    nombre: string; // Nombre del usuario
    email: string; // Email del usuario
    [key: string]: unknown; // Extensible para propiedades adicionales
  };
}
