import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolService } from '../services/rol.service';
import { UsuarioRolService } from '../services/usuario-rol.service';
import {
  CrearRolDto,
  ActualizarRolDto,
  CambiarEstadoRolDto,
} from '../dto/rol.dto';
import { EstadoRol } from '../enums/autorizacion.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../autenticacion/guards/jwt-auth.guard';
import {
  AutorizacionGuard,
  AuthenticatedRequest,
} from '../guards/autorizacion.guard';

@ApiTags('Autorización - Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AutorizacionGuard)
@Controller('api/v1/autorizacion/roles')
export class RolController {
  constructor(
    private rolService: RolService,
    private usuarioRolService: UsuarioRolService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El código del rol ya existe' })
  async crear(@Body() datos: CrearRolDto, @Req() req: AuthenticatedRequest) {
    const rol = await this.rolService.crear(datos, req.user.email);
    return { data: rol };
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles con paginación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente',
  })
  async listar(
    @Query() paginacion: PaginationQueryDto,
    @Query('nombre') nombre?: string,
    @Query('estado') estado?: EstadoRol,
  ) {
    const filtros = { nombre, estado };
    const resultado = await this.rolService.listarPaginado(paginacion, filtros);
    return resultado;
  }

  @Get('activos')
  @ApiOperation({ summary: 'Listar roles activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles activos obtenida exitosamente',
  })
  async listarActivos() {
    const roles = await this.rolService.listarActivos();
    return { data: roles };
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de roles' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async obtenerEstadisticas() {
    const estadisticas = await this.rolService.obtenerEstadisticas();
    return { data: estadisticas };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiResponse({ status: 200, description: 'Rol obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    const rol = await this.rolService.buscarPorId(id);
    return { data: rol };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiResponse({ status: 200, description: 'Rol actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto al actualizar el rol' })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarRolDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const rol = await this.rolService.actualizar(id, datos, req.user.email);
    return { data: rol };
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del rol' })
  @ApiResponse({
    status: 200,
    description: 'Estado del rol cambiado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede cambiar el estado del rol',
  })
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CambiarEstadoRolDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const rol = await this.rolService.cambiarEstado(id, datos, req.user.email);
    return { data: rol };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar rol (soft delete)' })
  @ApiResponse({ status: 200, description: 'Rol eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 409, description: 'No se puede eliminar el rol' })
  async eliminar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.rolService.eliminar(id, req.user.email);
    return { message: 'Rol eliminado exitosamente' };
  }

  @Get(':id/usuarios')
  @ApiOperation({ summary: 'Obtener usuarios asignados al rol' })
  @ApiResponse({ status: 200, description: 'Usuarios del rol obtenidos exitosamente' })
  async obtenerUsuarios(@Param('id', ParseIntPipe) id: number) {
    const usuarios = await this.usuarioRolService.obtenerUsuariosRol(id);
    return { data: usuarios };
  }

  @Get(':id/usuarios/count')
  @ApiOperation({ summary: 'Contar usuarios asignados al rol' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad de usuarios obtenida exitosamente',
  })
  async contarUsuarios(@Param('id', ParseIntPipe) id: number) {
    const cantidad = await this.rolService.contarUsuarios(id);
    return { data: { rolId: id, cantidadUsuarios: cantidad } };
  }
}
