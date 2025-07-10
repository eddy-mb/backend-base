/**
 * Interfaces específicas para el AuditoriaInterceptor
 */

import { Request as ExpressRequest } from 'express';

import {
  AuditoriaConfig,
  AuditoriaAction,
  AuditoriaMetadata,
} from './auditoria.interface';

export interface RequestWithUser extends ExpressRequest {
  user?: {
    id: number;
    [key: string]: unknown;
  };
  params: Record<string, string>;
}

export interface AuditoriaContext {
  config: AuditoriaConfig;
  accion: AuditoriaAction;
  tabla: string | null;
  idRegistro: string | null;
  metadata: AuditoriaMetadata;
  valoresAnteriores?: unknown;
  valoresNuevos?: unknown;
  error?: Error & { status?: number };
}

export interface AuditoriaErrorMetadata extends AuditoriaMetadata {
  error: {
    name: string;
    message: string;
    status: number;
  };
  success: false;
}
