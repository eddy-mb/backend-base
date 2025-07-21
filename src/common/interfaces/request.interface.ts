import { Request } from 'express';

/**
 * Request con usuario autenticado
 */
export interface RequestWithUser extends Request {
  user?: {
    id: number;
    idRol?: number;
    email?: string;
  };
}
