import { PaginationParams, PaginationMeta } from '../interfaces/interfaces';

/**
 * Utilidades básicas para paginación
 */
export class PaginationUtils {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 10;
  private static readonly MAX_LIMIT = 100;

  /**
   * Valida y normaliza parámetros de paginación
   */
  static validateParams(
    page: number = 1,
    limit: number = 10,
  ): PaginationParams {
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.min(this.MAX_LIMIT, Math.max(1, Math.floor(limit)));
    const offset = (validPage - 1) * validLimit;

    return {
      page: validPage,
      limit: validLimit,
      offset,
    };
  }

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
   * Configuración para TypeORM (Repository.find y QueryBuilder)
   */
  static toTypeOrmConfig(params: PaginationParams) {
    return {
      skip: params.offset,
      take: params.limit,
    };
  }

  /**
   * Extrae parámetros desde query de request
   */
  static fromQuery(query: Record<string, unknown>): PaginationParams {
    const page = query.page
      ? parseInt(query.page as string, 10)
      : this.DEFAULT_PAGE;
    const limit = query.limit
      ? parseInt(query.limit as string, 10)
      : this.DEFAULT_LIMIT;
    return this.validateParams(page, limit);
  }
}
