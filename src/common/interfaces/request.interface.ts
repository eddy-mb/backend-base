import { Request } from 'express';

/**
 * Request con usuario autenticado - Con información de roles
 */
export interface RequestWithUser extends Request {
  user?: {
    id: string; // ID del usuario
    nombre: string; // Nombre del usuario
    email: string; // Email del usuario
    roles?: string[]; // Códigos de roles del usuario
    rolActivo?: string; // Rol activo seleccionado
    [key: string]: unknown; // Extensible para propiedades adicionales
  };
}
