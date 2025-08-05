import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseController } from '@/common/base/base.controller';
import { RequestWithUser } from '@/common/interfaces/request.interface';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { RolesService } from '../services/roles.service';
import { PoliticasService } from '../services/politicas.service';
import {
  CrearRolDto,
  ActualizarRolDto,
  AsignarRolDto,
} from '../dto/autorizacion.dto';

@ApiTags('Autorización - Roles')
@Controller('api/v1/autorizacion/roles')
export class RolesController extends BaseController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly politicasService: PoliticasService,
  ) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo rol' })
  async crear(@Body() dto: CrearRolDto, @Req() req: RequestWithUser) {
    const usuarioCreacion = this.getUser(req);
    const rol = await this.rolesService.crear(dto, usuarioCreacion);
    return this.created(rol);
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles con paginación' })
  async obtenerTodos(@Query() query: PaginationQueryDto) {
    const resultado = await this.rolesService.obtenerTodos(query);
    return this.paginated(resultado.data, resultado.total);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  async obtenerPorId(@Param('id') id: string) {
    const rol = await this.rolesService.obtenerPorId(id);
    return this.success(rol);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar rol' })
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarRolDto,
    @Req() req: RequestWithUser,
  ) {
    const usuarioModificacion = this.getUser(req);
    const rol = await this.rolesService.actualizar(
      id,
      dto,
      usuarioModificacion,
    );
    return this.updated(rol);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar rol' })
  async eliminar(@Param('id') id: string, @Req() req: RequestWithUser) {
    const usuarioEliminacion = this.getUser(req);
    await this.rolesService.eliminar(id, usuarioEliminacion);
    return this.deleted();
  }

  @Post('asignar')
  @ApiOperation({ summary: 'Asignar rol a usuario' })
  async asignarRol(@Body() dto: AsignarRolDto, @Req() req: RequestWithUser) {
    const usuarioCreacion = this.getUser(req);
    const asignacion = await this.rolesService.asignarRol(dto, usuarioCreacion);
    await this.politicasService.asignarRolAUsuario(
      dto.usuarioId,
      dto.rolCodigo,
    );
    return this.created(asignacion);
  }

  @Delete('usuario/:usuarioId/rol/:rolCodigo')
  @ApiOperation({ summary: 'Remover rol de usuario' })
  async removerRol(
    @Param('usuarioId') usuarioId: string,
    @Param('rolCodigo') rolCodigo: string,
    @Req() req: RequestWithUser,
  ) {
    const usuarioEliminacion = this.getUser(req);
    await this.rolesService.removerRol(
      usuarioId,
      rolCodigo,
      usuarioEliminacion,
    );
    await this.politicasService.removerRolDeUsuario(usuarioId, rolCodigo);
    return this.deleted();
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Obtener roles asignados a un usuario' })
  async obtenerRolesUsuario(@Param('usuarioId') usuarioId: string) {
    const roles = await this.rolesService.obtenerRolesUsuario(usuarioId);
    return this.success(roles);
  }
}
