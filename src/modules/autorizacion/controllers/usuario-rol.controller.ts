import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsuarioRolService } from '../services/usuario-rol.service';
import { 
  AsignarRolDto, 
  CambiarEstadoUsuarioRolDto, 
  AsignarRolesMasivoDto 
} from '../dto/usuario-rol.dto';
import { EstadoUsuarioRol } from '../enums/autorizacion.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../autenticacion/guards/jwt-auth.guard';
import { AutorizacionGuard, AuthenticatedRequest } from '../guards/autorizacion.guard';

@ApiTags('Autorización - Usuario-Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AutorizacionGuard)
@Controller('api/v1/autorizacion/usuarios')
export class UsuarioRolController {
  constructor(private usuarioRolService: UsuarioRolService) {}

  @Post(':usuarioId/roles')
  @ApiOperation({ summary: 'Asignar un rol a un usuario' })
  @ApiResponse({ status: 201, description: 'Rol asignado exitosamente' })
  async asignarRol(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: { rolId: number },
    @Req() req: AuthenticatedRequest,
  ) {
    const asignacion = await this.usuarioRolService.asignar(
      { usuarioId, rolId: datos.rolId },
      req.user.email,
    );
    return { data: asignacion };
  }

  @Post(':usuarioId/roles/masivo')
  @ApiOperation({ summary: 'Asignar múltiples roles a un usuario' })
  async asignarRolesMasivo(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: { roleIds: number[] },
    @Req() req: AuthenticatedRequest,
  ) {
    const asignaciones = await this.usuarioRolService.asignarRolesMasivo(
      { usuarioId, roleIds: datos.roleIds },
      req.user.email,
    );
    return { data: asignaciones };
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de asignaciones' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async obtenerEstadisticas() {
    const estadisticas = await this.usuarioRolService.obtenerEstadisticas();
    return { data: estadisticas };
  }

  @Get('asignaciones')
  @ApiOperation({ summary: 'Listar todas las asignaciones con paginación' })
  @ApiResponse({ status: 200, description: 'Lista de asignaciones obtenida exitosamente' })
  async listarTodasAsignaciones(
    @Query() paginacion: PaginationQueryDto,
    @Query('usuarioId') usuarioId?: number,
    @Query('rolId') rolId?: number,
    @Query('estado') estado?: EstadoUsuarioRol,
  ) {
    const filtros = { usuarioId, rolId, estado };
    const resultado = await this.usuarioRolService.listarAsignaciones(paginacion, filtros);
    return resultado;
  }

  @Get(':usuarioId/roles')
  @ApiOperation({ summary: 'Obtener roles asignados a un usuario' })
  async obtenerRolesUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    const roles = await this.usuarioRolService.obtenerRolesUsuario(usuarioId);
    return { data: roles };
  }

  @Delete(':usuarioId/roles/:rolId')
  @ApiOperation({ summary: 'Desasignar un rol de un usuario' })
  async desasignarRol(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('rolId', ParseIntPipe) rolId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.usuarioRolService.desasignar(usuarioId, rolId, req.user.email);
    return { message: 'Rol desasignado exitosamente' };
  }

  @Patch(':usuarioId/roles/:rolId/estado')
  @ApiOperation({ summary: 'Cambiar estado de asignación de rol' })
  async cambiarEstadoAsignacion(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('rolId', ParseIntPipe) rolId: number,
    @Body() datos: CambiarEstadoUsuarioRolDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.usuarioRolService.cambiarEstado(usuarioId, rolId, datos, req.user.email);
    return { message: 'Estado de asignación cambiado exitosamente' };
  }

  @Post(':usuarioId/roles/reemplazar')
  @ApiOperation({ summary: 'Reemplazar todos los roles de un usuario' })
  async reemplazarRoles(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: { roleIds: number[] },
    @Req() req: AuthenticatedRequest,
  ) {
    const asignaciones = await this.usuarioRolService.reemplazarRoles(
      usuarioId,
      datos.roleIds,
      req.user.email,
    );
    return { data: asignaciones };
  }
}
