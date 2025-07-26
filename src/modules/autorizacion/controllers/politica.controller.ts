import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PoliticaService } from '../services/politica.service';
import { CrearPoliticaDto, CrearPoliticasDto } from '../dto/politica.dto';
import { AccionHttp, AplicacionTipo } from '../enums/autorizacion.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../autenticacion/guards/jwt-auth.guard';
import {
  AutorizacionGuard,
  AuthenticatedRequest,
} from '../guards/autorizacion.guard';

@ApiTags('Autorización - Políticas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AutorizacionGuard)
@Controller('api/v1/autorizacion/politicas')
export class PoliticaController {
  constructor(private politicaService: PoliticaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva política de acceso' })
  @ApiResponse({ status: 201, description: 'Política creada exitosamente' })
  @ApiResponse({ status: 409, description: 'La política ya existe' })
  async crear(
    @Body() datos: CrearPoliticaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const politica = await this.politicaService.crear(datos, req.user.email);
    return { data: politica };
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Crear múltiples políticas para un rol' })
  @ApiResponse({ status: 201, description: 'Políticas creadas exitosamente' })
  @ApiResponse({ status: 409, description: 'Algunas políticas ya existen' })
  async crearMasivo(
    @Body() datos: CrearPoliticasDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const politicas = await this.politicaService.crearMasivo(
      datos,
      req.user.email,
    );
    return { data: politicas };
  }

  @Get()
  @ApiOperation({ summary: 'Listar políticas con paginación y filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de políticas obtenida exitosamente',
  })
  async listar(
    @Query() paginacion: PaginationQueryDto,
    @Query('rol') rol?: string,
    @Query('recurso') recurso?: string,
    @Query('accion') accion?: AccionHttp,
    @Query('aplicacion') aplicacion?: AplicacionTipo,
  ) {
    const filtros = { rol, recurso, accion, aplicacion };
    const resultado = await this.politicaService.listarPaginado(
      paginacion,
      filtros,
    );
    return resultado;
  }

  @Get('roles')
  @ApiOperation({ summary: 'Obtener roles que tienen políticas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente',
  })
  async obtenerRolesConPoliticas() {
    const roles = await this.politicaService.obtenerRolesConPoliticas();
    return { data: roles };
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de políticas' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async obtenerEstadisticas() {
    const estadisticas = await this.politicaService.obtenerEstadisticas();
    return { data: estadisticas };
  }

  @Get('cache/estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas del cache de políticas' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del cache obtenidas exitosamente',
  })
  async obtenerEstadisticasCache() {
    const estadisticas = await this.politicaService.obtenerEstadisticasCache();
    return { data: estadisticas };
  }

  @Post('cache/sincronizar')
  @ApiOperation({ summary: 'Sincronizar cache de políticas' })
  @ApiResponse({ status: 200, description: 'Cache sincronizado exitosamente' })
  async sincronizarCache() {
    await this.politicaService.sincronizarCache();
    return { message: 'Cache de políticas sincronizado exitosamente' };
  }

  @Get('rol/:rol')
  @ApiOperation({ summary: 'Obtener políticas de un rol específico' })
  @ApiResponse({
    status: 200,
    description: 'Políticas del rol obtenidas exitosamente',
  })
  async obtenerPorRol(@Param('rol') rol: string) {
    const politicas = await this.politicaService.buscarPorRol(rol);
    return { data: politicas };
  }

  @Delete()
  @ApiOperation({ summary: 'Eliminar una política específica' })
  @ApiResponse({ status: 200, description: 'Política eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Política no encontrada' })
  async eliminar(
    @Query('rol') rol: string,
    @Query('recurso') recurso: string,
    @Query('accion') accion: AccionHttp,
    @Query('aplicacion') aplicacion: AplicacionTipo,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.politicaService.eliminar(
      rol,
      recurso,
      accion,
      aplicacion,
      req.user.email,
    );
    return { message: 'Política eliminada exitosamente' };
  }

  @Delete('rol/:rol')
  @ApiOperation({ summary: 'Eliminar todas las políticas de un rol' })
  @ApiResponse({
    status: 200,
    description: 'Políticas del rol eliminadas exitosamente',
  })
  async eliminarPorRol(
    @Param('rol') rol: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.politicaService.eliminarPorRol(rol, req.user.email);
    return {
      message: `Todas las políticas del rol '${rol}' eliminadas exitosamente`,
    };
  }
}
