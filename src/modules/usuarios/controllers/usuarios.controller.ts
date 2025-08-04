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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
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
import { CrearUsuarioDto } from '../dto/request/crear-usuario.dto';
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

@Controller('usuarios')
export class UsuariosController extends BaseController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly avatarService: AvatarService,
  ) {
    super();
  }

  // ==================== ENDPOINTS PÚBLICOS ====================

  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @ApiTags('Usuarios - Públicos')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, type: UsuarioResponseDto })
  async registrarUsuario(
    @Body() datos: CrearUsuarioDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const usuario = await this.usuariosService.crear(datos, ip, userAgent);

    return this.created(
      plainToInstance(UsuarioResponseDto, usuario),
      MENSAJES.USUARIO_CREADO,
    );
  }

  // ==================== ENDPOINTS AUTENTICADOS ====================

  @Get('perfil')
  @ApiTags('Usuarios - Perfil')
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
  @ApiTags('Usuarios - Perfil')
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

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiTags('Usuarios - Perfil')
  @ApiOperation({ summary: 'Subir avatar del usuario' })
  @ApiConsumes('multipart/form-data')
  // @UseGuards(AuthGuard) // TODO: Activar con Módulo 8
  async subirAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile(ValidacionAvatarPipe) archivo: Express.Multer.File,
  ) {
    const usuarioId = this.getUser(req);

    // Guardar archivo físico
    const resultadoAvatar = await this.avatarService.guardarAvatar(
      usuarioId,
      archivo,
    );

    // Actualizar usuario y obtener avatar anterior
    const avatarAnterior = await this.usuariosService.actualizarAvatar(
      usuarioId,
      resultadoAvatar.nombreArchivo,
    );

    // Eliminar avatar anterior si existía
    if (avatarAnterior) {
      await this.avatarService.eliminarAvatar(avatarAnterior).catch(() => {
        // Log error pero no fallar
      });
    }

    return this.created({
      avatarUrl: resultadoAvatar.url,
      filename: resultadoAvatar.nombreArchivo,
      size: resultadoAvatar.tamano,
    });
  }

  @Delete('avatar')
  @ApiTags('Usuarios - Perfil')
  @ApiOperation({ summary: 'Eliminar avatar del usuario' })
  // @UseGuards(AuthGuard) // TODO: Activar con Módulo 8
  async eliminarAvatar(@Req() req: RequestWithUser) {
    const usuarioId = this.getUser(req);

    const avatarAnterior = await this.usuariosService.eliminarAvatar(usuarioId);

    if (avatarAnterior) {
      await this.avatarService.eliminarAvatar(avatarAnterior).catch(() => {
        // Log error pero no fallar
      });
    }

    return this.deleted(null, MENSAJES.AVATAR_ELIMINADO);
  }

  @Put('cambiar-password')
  @ApiTags('Usuarios - Perfil')
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
  @ApiTags('Usuarios - Administración')
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
  @ApiTags('Usuarios - Administración')
  @ApiOperation({ summary: 'Obtener estadísticas de usuarios' })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async obtenerEstadisticas() {
    const estadisticas = await this.usuariosService.obtenerEstadisticas();
    return this.success(estadisticas);
  }

  @Get(':id')
  @ApiTags('Usuarios - Administración')
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
  @ApiTags('Usuarios - Administración')
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
  @ApiTags('Usuarios - Administración')
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  // @UseGuards(AuthGuard, AdminGuard) // TODO: Activar con Módulos 8 y 9
  async eliminarUsuario(@Param('id') id: string, @Req() req: RequestWithUser) {
    const usuarioAdministrador = this.getUser(req);
    await this.usuariosService.eliminar(id, usuarioAdministrador);

    return this.deleted(null, MENSAJES.USUARIO_ELIMINADO);
  }

  @Post(':id/restaurar')
  @ApiTags('Usuarios - Administración')
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
