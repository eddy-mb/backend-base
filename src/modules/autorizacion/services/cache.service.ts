import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service';
import { PoliticaRepository } from '../repositories/politica.repository';
import { Politica } from '../entities/politica.entity';
import { AccionHttp, AplicacionTipo } from '../enums/autorizacion.enums';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private readonly CACHE_PREFIX = 'auth:';
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(
    private redisService: RedisService,
    private politicaRepository: PoliticaRepository,
  ) {}

  async onModuleInit() {
    if (this.redisService.isEnabled()) {
      await this.cargarPoliticasEnCache();
    }
  }

  /**
   * Obtiene las políticas de un rol desde cache o BD
   */
  async obtenerPoliticas(rol: string): Promise<Politica[]> {
    if (!this.redisService.isEnabled()) {
      return this.politicaRepository.buscarPorRol(rol);
    }

    try {
      const cacheKey = `${this.CACHE_PREFIX}rol:${rol}`;
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as Politica[];
      }

      // Cache miss - buscar en BD y cachear
      const politicas = await this.politicaRepository.buscarPorRol(rol);
      await this.redisService.set(
        cacheKey,
        JSON.stringify(politicas),
        this.CACHE_TTL,
      );

      return politicas;
    } catch (error) {
      this.logger.error(`Error obteniendo políticas del rol ${rol}:`, error);
      // Fallback a BD
      return this.politicaRepository.buscarPorRol(rol);
    }
  }

  /**
   * Verifica permisos con cache optimizado
   */
  async verificarPermiso(
    rol: string,
    recurso: string,
    accion: AccionHttp,
    aplicacion: AplicacionTipo = AplicacionTipo.BACKEND,
  ): Promise<boolean> {
    try {
      const politicas = await this.obtenerPoliticas(rol);

      // Buscar coincidencia exacta primero
      const coincidenciaExacta = politicas.find(
        (p) =>
          p.recurso === recurso &&
          p.accion === accion &&
          p.aplicacion === aplicacion,
      );

      if (coincidenciaExacta) {
        return true;
      }

      // Buscar coincidencias con wildcards
      const coincidenciaWildcard = politicas.find(
        (p) =>
          p.esWildcard &&
          p.coincideConUrl(recurso) &&
          p.accion === accion &&
          p.aplicacion === aplicacion,
      );

      return !!coincidenciaWildcard;
    } catch (error) {
      this.logger.error('Error verificando permiso:', error);
      return false;
    }
  }

  /**
   * Carga todas las políticas en cache al iniciar
   */
  async cargarPoliticasEnCache(): Promise<void> {
    if (!this.redisService.isEnabled()) {
      return;
    }

    try {
      this.logger.log('Cargando políticas en cache...');

      const roles = await this.politicaRepository.obtenerRolesConPoliticas();

      for (const rol of roles) {
        const politicas = await this.politicaRepository.buscarPorRol(rol);
        const cacheKey = `${this.CACHE_PREFIX}rol:${rol}`;

        await this.redisService.set(
          cacheKey,
          JSON.stringify(politicas),
          this.CACHE_TTL,
        );
      }

      // Guardar timestamp de última carga
      await this.redisService.set(
        `${this.CACHE_PREFIX}last_load`,
        new Date().toISOString(),
        this.CACHE_TTL,
      );

      this.logger.log(`Políticas cargadas en cache para ${roles.length} roles`);
    } catch (error) {
      this.logger.error('Error cargando políticas en cache:', error);
    }
  }

  /**
   * Invalida todo el cache de autorización
   */
  async invalidarCache(): Promise<void> {
    if (!this.redisService.isEnabled()) {
      return;
    }

    try {
      const keys = await this.redisService.keys(`${this.CACHE_PREFIX}*`);

      if (keys.length > 0) {
        for (const key of keys) {
          await this.redisService.del(key);
        }
        this.logger.log(`Cache invalidado: ${keys.length} claves eliminadas`);
      }

      // Recargar cache
      await this.cargarPoliticasEnCache();
    } catch (error) {
      this.logger.error('Error invalidando cache:', error);
    }
  }

  /**
   * Invalida cache para un rol específico
   */
  async invalidarCacheRol(rol: string): Promise<void> {
    if (!this.redisService.isEnabled()) {
      return;
    }

    try {
      const cacheKey = `${this.CACHE_PREFIX}rol:${rol}`;
      await this.redisService.del(cacheKey);

      // Recargar políticas del rol
      const politicas = await this.politicaRepository.buscarPorRol(rol);
      await this.redisService.set(
        cacheKey,
        JSON.stringify(politicas),
        this.CACHE_TTL,
      );

      this.logger.log(`Cache invalidado para rol: ${rol}`);
    } catch (error) {
      this.logger.error(`Error invalidando cache del rol ${rol}:`, error);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  async obtenerEstadisticasCache(): Promise<{
    habilitado: boolean;
    rolesEnCache: number;
    ultimaCarga?: string;
  }> {
    const estadisticas = {
      habilitado: this.redisService.isEnabled(),
      rolesEnCache: 0,
      ultimaCarga: undefined as string | undefined,
    };

    if (!this.redisService.isEnabled()) {
      return estadisticas;
    }

    try {
      const keys = await this.redisService.keys(`${this.CACHE_PREFIX}rol:*`);
      estadisticas.rolesEnCache = keys.length;

      const ultimaCarga = await this.redisService.get(
        `${this.CACHE_PREFIX}last_load`,
      );
      if (ultimaCarga) {
        estadisticas.ultimaCarga = ultimaCarga;
      }
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de cache:', error);
    }

    return estadisticas;
  }
}
