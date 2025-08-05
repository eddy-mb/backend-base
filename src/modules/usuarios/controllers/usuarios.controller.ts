import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { BaseController, RequestWithUser } from '../../../common';
import { UsuariosService } from '../services/usuarios.service';
import { AvatarService } from '../services/avatar.service';

// DTOs Request
import { ActualizarPerfilDto } from '../dto/request/perfil.dto';
import {
  CambiarPasswordDto,
  FiltrosUsuarioDto,
  CambiarEstadoUsuarioDto,
} from '../dto/request/usuario.dto';

// DTOs Response
import {
  UsuarioResponseDto,
  UsuarioConPerfilResponseDto,
  UsuarioAdminResponseDto,
} from '../dto/response/usuario-response.dto';

import { ValidacionAvatarPipe } from '../pipes/validacion-avatar.pipe';
import { MENSAJES } from '../constants/usuarios.constants';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController extends BaseController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly avatarService: AvatarService,
  ) {
    super();
  }

  // ==================== ENDPOINTS AUTENTICADOS ====================
  // NOTA: Registro y verificarEmail se movieron al Módulo 8 (Autenticación)

  @Get('perfil')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, type: UsuarioConPerfilResponseDto })
  // @UseGuards(AuthGuard) // TODO: Activar con Módulo 8
  async obtenerPerfil(@Req() req: RequestWithUser) {
    const usuarioId = this.getUser(req);
    const usuario = await this.usuariosService.buscarPorId(usuarioId, true);

    const response = plainToInstance(UsuarioConPerfilResponseDto, usuario);
    if (response.perfil?.avatar) {
      response.perfil.avatarUrl = this.usuariosService.construirAvatarUrl(
        response.perfil.avatar,
      );
    }

    return this.success(response);
  }

  @Put('perfil')
  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  @ApiResponse({ status: 200, type: UsuarioConPerfilResponseDto })
  // @UseGuards(AuthGuard) // TODO: Activar con Módulo 8
  async actualizarPerfil(
    @Req() req: RequestWithUser,
    @Body() datos: ActualizarPerfilDto,
  ) {
    const usuarioId = this.getUser(req);
    const usuario = await this.usuariosService.actualizarPerfil(
      usuarioId,
      datos,
    );

    const response = plainToInstance(UsuarioConPerfilResponseDto, usuario);
    if (response.perfil?.avatar) {
      response.perfil.avatarUrl = this.usuariosService.construirAvatarUrl(
        response.perfil.avatar,
      );
    }

    return this.updated(response, MENSAJES.PERFIL_ACTUALIZADO);
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Subir avatar del usuario' })
  @ApiConsumes('multipart/form-data')
  // @UseGuards(AuthGuard) // TODO: Activar con Módulo 8
  async subirAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile(ValidacionAvatarPipe) archivo: Express.Multer.File,
  ) {
    const usuarioId = this.getUser(req);

    const resultadoAvatar = await this.avatarService.guardarAvatar(
      usuarioId,
      archivo,
    );

    const avatarAnterior = await this.usuariosService.actualizarAvatar(
      usuarioId,
      resultadoAvatar.nombreArchivo,
    );

    if (avatarAnterior) {
      await this.avatarService.eliminarAvatar(avatarAnterior).catch(() => {});
    }

    return this.created({
      avatarUrl: resultadoAvatar.url,
      filename: resultadoAvatar.nombreArchivo,
      size: resultadoAvatar.tamano,
    });
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Eliminar avatar del usuario' })
  // @UseGuards(AuthGuard) // TODO: Activar con Módulo 8
  async eliminarAvatar(@Req() req: RequestWithUser) {
    const usuarioId = this.getUser(req);
    const avatarAnterior = await this.usuariosService.eliminarAvatar(usuarioId);

    if (avatarAnterior) {
      await this.avatarService.eliminarAvatar(avatarAnterior).catch(() => {});
    }

    return this.deleted(null, MENSAJES.AVATAR_ELIMINADO);
  }

  @Put('cambiar-password')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario' })
  // @UseGuards(AuthGuard) // TODO: Activar con Módulo 8
  async cambiarPassword(
    @Req() req: RequestWithUser,
    @Body() datos: CambiarPasswordDto,
  ) {
    const usuarioId = this.getUser(req);
    await this.usuariosService.cambiarPassword(usuarioId, datos);
    return this.success(null, MENSAJES.PASSWORD_CAMBIADO);
  }

  // ==================== ENDPOINTS ADMINISTRATIVOS ====================

  @Get()
  @ApiOperation({ summary: 'Listar usuarios con filtros' })
  @ApiResponse({ status: 200, type: [UsuarioAdminResponseDto] })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async listarUsuarios(@Query() filtros: FiltrosUsuarioDto) {
    const resultado = await this.usuariosService.listarConFiltros(filtros);

    const usuariosResponse = resultado.data.map((usuario) => {
      const response = plainToInstance(UsuarioAdminResponseDto, usuario);
      if (response.perfil?.avatar) {
        response.perfil.avatarUrl = this.usuariosService.construirAvatarUrl(
          response.perfil.avatar,
        );
      }
      return response;
    });

    return this.paginated(usuariosResponse, resultado.total);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de usuarios' })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async obtenerEstadisticas() {
    const estadisticas = await this.usuariosService.obtenerEstadisticas();
    return this.success(estadisticas);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, type: UsuarioAdminResponseDto })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async obtenerUsuario(@Param('id') id: string) {
    const usuario = await this.usuariosService.buscarPorId(id, true);

    const response = plainToInstance(UsuarioAdminResponseDto, usuario);
    if (response.perfil?.avatar) {
      response.perfil.avatarUrl = this.usuariosService.construirAvatarUrl(
        response.perfil.avatar,
      );
    }

    return this.success(response);
  }

  @Put(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado de usuario' })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async cambiarEstado(
    @Param('id') id: string,
    @Body() datos: CambiarEstadoUsuarioDto,
    @Req() req: RequestWithUser,
  ) {
    const usuarioAdministrador = this.getUser(req);
    const usuario = await this.usuariosService.cambiarEstado(
      id,
      datos,
      usuarioAdministrador,
    );

    return this.updated(
      plainToInstance(UsuarioResponseDto, usuario),
      `Estado del usuario cambiado a '${datos.estado}' exitosamente`,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async eliminarUsuario(@Param('id') id: string, @Req() req: RequestWithUser) {
    const usuarioAdministrador = this.getUser(req);
    await this.usuariosService.eliminar(id, usuarioAdministrador);
    return this.deleted(null, MENSAJES.USUARIO_ELIMINADO);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id/restaurar')
  @ApiOperation({ summary: 'Restaurar usuario eliminado' })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async restaurarUsuario(@Param('id') id: string, @Req() req: RequestWithUser) {
    const usuarioAdministrador = this.getUser(req);
    const usuario = await this.usuariosService.restaurar(
      id,
      usuarioAdministrador,
    );

    return this.success(
      plainToInstance(UsuarioResponseDto, usuario),
      MENSAJES.USUARIO_RESTAURADO,
    );
  }
}
