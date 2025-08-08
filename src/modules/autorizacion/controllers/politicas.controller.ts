import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseController } from '@/common/base/base.controller';
import { PoliticasService } from '../services/politicas.service';
import { CasbinService } from '../services/casbin.service';
import { CrearPoliticaDto } from '../dto/autorizacion.dto';
import { CasbinGuard } from '../guards/casbin.guard';
import { JwtAuthGuard } from '../../../modules/autenticacion/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, CasbinGuard)
@ApiTags('Autorización - Políticas')
@Controller('autorizacion/politicas')
export class PoliticasController extends BaseController {
  constructor(
    private readonly politicasService: PoliticasService,
    private readonly casbinService: CasbinService,
  ) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva política' })
  async crearPolitica(@Body() dto: CrearPoliticaDto) {
    const creada = await this.politicasService.crearPolitica(dto);
    if (creada) {
      await this.casbinService.recargarPoliticas();
      return this.created(dto);
    }
    return this.success(null, 'La política ya existe');
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las políticas' })
  async obtenerTodasLasPoliticas() {
    const politicas = await this.politicasService.obtenerTodasLasPoliticas();
    return this.success(politicas);
  }

  @Get('rol/:rol')
  @ApiOperation({ summary: 'Obtener políticas de un rol' })
  async obtenerPoliticasRol(@Param('rol') rol: string) {
    const politicas = await this.politicasService.obtenerPoliticasRol(rol);
    return this.success(politicas);
  }

  @Post('eliminar')
  @ApiOperation({ summary: 'Eliminar política específica' })
  async eliminarPolitica(@Body() dto: CrearPoliticaDto) {
    const eliminada = await this.politicasService.eliminarPolitica(
      dto.rol,
      dto.ruta,
      dto.accion,
    );

    if (eliminada) {
      await this.casbinService.recargarPoliticas();
      return this.deleted();
    }
    return this.success(null, 'La política no existe');
  }

  @Post('verificar')
  @ApiOperation({ summary: 'Verificar permisos' })
  async verificarPermisos(@Body() dto: CrearPoliticaDto) {
    const permitido = await this.casbinService.enforce(
      dto.rol,
      dto.ruta,
      dto.accion,
    );
    return this.success({ ...dto, permitido });
  }
}
