import { PaginationParams, PaginationMeta } from '../interfaces/interfaces';

/**
 * Utilidades para paginación
 */
export class PaginationUtils {
  /**
   * Calcula metadatos de paginación
   */
  static calculateMeta(
    total: number,
    params: PaginationParams,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / params.limit);

    return {
      total,
      page: params.page,
      limit: params.limit,
      total_pages: totalPages,
      has_next: params.page < totalPages,
      has_previous: params.page > 1,
    };
  }

  /**
   * Extrae parámetros desde query de request
   */
  static fromQuery(query: Record<string, unknown>): PaginationParams {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit as string) || 10),
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }
}
