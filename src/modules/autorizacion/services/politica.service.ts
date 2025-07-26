import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PoliticaRepository } from '../repositories/politica.repository';
import { CacheService } from './cache.service';
import { Politica } from '../entities/politica.entity';
import { CrearPoliticaDto, CrearPoliticasDto } from '../dto/politica.dto';
import { AccionHttp, AplicacionTipo } from '../enums/autorizacion.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UrlMatcherUtil } from '../utils/url-matcher.util';

@Injectable()
export class PoliticaService {
  constructor(
    private politicaRepository: PoliticaRepository,
    private cacheService: CacheService,
  ) {}

  /**
   * Crear una nueva política
   */
  async crear(datos: CrearPoliticaDto, usuario?: string): Promise<Politica> {
    // Verificar que no exista la política
    const existe = await this.politicaRepository.existePolitica(
      datos.rol,
      datos.recurso,
      datos.accion,
      datos.aplicacion,
    );

    if (existe) {
      throw new ConflictException(
        `Ya existe una política para ${datos.rol}:${datos.recurso}:${datos.accion}:${datos.aplicacion}`,
      );
    }

    const politica = await this.politicaRepository.crear({
      ...datos,
      usuarioCreacion: usuario,
    });

    // Invalidar cache del rol
    await this.cacheService.invalidarCacheRol(datos.rol);

    return politica;
  }

  /**
   * Crear múltiples políticas
   */
  async crearMasivo(
    datos: CrearPoliticasDto,
    usuario?: string,
  ): Promise<Politica[]> {
    const politicasACrear: Partial<Politica>[] = [];

    // Verificar que no existan las políticas
    for (const politica of datos.politicas) {
      const existe = await this.politicaRepository.existePolitica(
        datos.rol,
        politica.recurso,
        politica.accion,
        politica.aplicacion,
      );

      if (!existe) {
        politicasACrear.push({
          rol: datos.rol,
          recurso: politica.recurso,
          accion: politica.accion,
          aplicacion: politica.aplicacion,
          usuarioCreacion: usuario,
        });
      }
    }

    if (politicasACrear.length === 0) {
      throw new ConflictException('Todas las políticas ya existen');
    }

    const politicasCreadas =
      await this.politicaRepository.crearMasivo(politicasACrear);

    // Invalidar cache del rol
    await this.cacheService.invalidarCacheRol(datos.rol);

    return politicasCreadas;
  }

  /**
   * Listar políticas con paginación
   */
  async listarPaginado(
    paginacion: PaginationQueryDto,
    filtros?: {
      rol?: string;
      recurso?: string;
      accion?: AccionHttp;
      aplicacion?: AplicacionTipo;
    },
  ): Promise<{ data: Politica[]; total: number }> {
    return this.politicaRepository.listarPaginado(
      paginacion.page,
      paginacion.limit,
      filtros,
    );
  }

  /**
   * Buscar políticas por rol
   */
  async buscarPorRol(rol: string): Promise<Politica[]> {
    return this.politicaRepository.buscarPorRol(rol);
  }

  /**
   * Eliminar una política específica
   */
  async eliminar(
    rol: string,
    recurso: string,
    accion: AccionHttp,
    aplicacion: AplicacionTipo,
    usuario?: string,
  ): Promise<void> {
    const politica = await this.politicaRepository.buscarPolitica(
      rol,
      recurso,
      accion,
      aplicacion,
    );

    if (!politica) {
      throw new NotFoundException(
        `Política no encontrada: ${rol}:${recurso}:${accion}:${aplicacion}`,
      );
    }

    await this.politicaRepository.eliminar(
      rol,
      recurso,
      accion,
      aplicacion,
      usuario,
    );

    // Invalidar cache del rol
    await this.cacheService.invalidarCacheRol(rol);
  }

  /**
   * Eliminar todas las políticas de un rol
   */
  async eliminarPorRol(rol: string, usuario?: string): Promise<void> {
    await this.politicaRepository.eliminarPorRol(rol, usuario);

    // Invalidar cache del rol
    await this.cacheService.invalidarCacheRol(rol);
  }

  /**
   * Verificar permisos usando cache y wildcards
   */
  async verificarPermiso(
    rol: string,
    url: string,
    metodo: string,
    aplicacion: AplicacionTipo = AplicacionTipo.BACKEND,
  ): Promise<boolean> {
    try {
      // Limpiar y normalizar URL
      const urlLimpia = UrlMatcherUtil.limpiarUrl(url);
      const accion = metodo.toUpperCase() as AccionHttp;

      // Verificar con cache service
      return await this.cacheService.verificarPermiso(
        rol,
        urlLimpia,
        accion,
        aplicacion,
      );
    } catch {
      // En caso de error, denegar acceso por seguridad
      return false;
    }
  }

  /**
   * Verificar permisos con variantes de URL (específica y wildcards)
   */
  async verificarPermisoConVariantes(
    rol: string,
    url: string,
    metodo: string,
    aplicacion: AplicacionTipo = AplicacionTipo.BACKEND,
  ): Promise<boolean> {
    try {
      const urlLimpia = UrlMatcherUtil.limpiarUrl(url);
      const accion = metodo.toUpperCase() as AccionHttp;
      const variantes = UrlMatcherUtil.generarVariantesUrl(urlLimpia);

      // Buscar políticas para todas las variantes
      const politicas = await this.politicaRepository.buscarPorRecursoYAccion(
        rol,
        variantes,
        accion,
        aplicacion,
      );

      return politicas.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Obtener roles que tienen políticas
   */
  async obtenerRolesConPoliticas(): Promise<string[]> {
    return this.politicaRepository.obtenerRolesConPoliticas();
  }

  /**
   * Obtener estadísticas de políticas
   */
  async obtenerEstadisticas(): Promise<{
    totalPoliticas: number;
    rolesConPoliticas: number;
    politicasPorAplicacion: Record<AplicacionTipo, number>;
    politicasPorAccion: Record<AccionHttp, number>;
    politicasWildcard: number;
  }> {
    const todas = await this.politicaRepository.listarPaginado(1, 10000);
    const roles = await this.obtenerRolesConPoliticas();

    const estadisticas = {
      totalPoliticas: todas.total,
      rolesConPoliticas: roles.length,
      politicasPorAplicacion: {
        [AplicacionTipo.BACKEND]: 0,
        [AplicacionTipo.FRONTEND]: 0,
      },
      politicasPorAccion: {
        [AccionHttp.GET]: 0,
        [AccionHttp.POST]: 0,
        [AccionHttp.PUT]: 0,
        [AccionHttp.DELETE]: 0,
        [AccionHttp.PATCH]: 0,
      },
      politicasWildcard: 0,
    };

    for (const politica of todas.data) {
      estadisticas.politicasPorAplicacion[politica.aplicacion]++;
      estadisticas.politicasPorAccion[politica.accion]++;

      if (politica.esWildcard) {
        estadisticas.politicasWildcard++;
      }
    }

    return estadisticas;
  }

  /**
   * Sincronizar políticas con cache
   */
  async sincronizarCache(): Promise<void> {
    await this.cacheService.invalidarCache();
  }

  /**
   * Obtener estadísticas del cache
   */
  async obtenerEstadisticasCache(): Promise<{
    habilitado: boolean;
    rolesEnCache: number;
    ultimaCarga?: string;
  }> {
    return this.cacheService.obtenerEstadisticasCache();
  }
}
