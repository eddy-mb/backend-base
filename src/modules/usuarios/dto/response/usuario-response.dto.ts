import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoUsuario } from '../../enums/usuario.enum';
import { ConfiguracionUsuario } from '../../interfaces/usuario.interface';

// ==================== DTO BASE USUARIO ====================

export class UsuarioResponseDto {
  @ApiProperty({ description: 'ID único del usuario' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Email del usuario' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @Expose()
  nombre: string;

  @ApiProperty({
    description: 'Estado del usuario',
    enum: EstadoUsuario,
  })
  @Expose()
  estado: EstadoUsuario;

  @ApiProperty({ description: 'Indica si el email está verificado' })
  @Expose()
  emailVerificado: boolean;

  @ApiProperty({ description: 'Fecha de creación del usuario' })
  @Expose()
  fechaCreacion: Date;

  @ApiProperty({ description: 'Fecha de última modificación' })
  @Expose()
  fechaModificacion: Date;

  @ApiProperty({
    description: 'Fecha de última actividad',
    required: false,
  })
  @Expose()
  ultimaActividad?: Date;
}

// ==================== DTO PERFIL ====================

export class PerfilResponseDto {
  @ApiProperty({ description: 'ID del perfil' })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    required: false,
  })
  @Expose()
  apellidos?: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    required: false,
  })
  @Expose()
  telefono?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento',
    required: false,
  })
  @Expose()
  fechaNacimiento?: Date;

  @ApiProperty({
    description: 'Nombre del archivo de avatar',
    required: false,
  })
  @Expose()
  avatar?: string;

  @ApiProperty({
    description: 'URL completa del avatar',
    required: false,
  })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Biografía del usuario',
    required: false,
  })
  @Expose()
  biografia?: string;

  @ApiProperty({
    description: 'Configuraciones personalizadas del usuario',
    type: 'object',
    additionalProperties: true,
  })
  @Expose()
  configuraciones: ConfiguracionUsuario;

  @ApiProperty({ description: 'Zona horaria del usuario' })
  @Expose()
  zonaHoraria: string;

  @ApiProperty({ description: 'Idioma preferido del usuario' })
  @Expose()
  idioma: string;

  @ApiProperty({ description: 'Nombre completo calculado' })
  @Expose()
  get nombreCompleto(): string {
    // Este getter se calculará desde la entidad
    return '';
  }
}

// ==================== DTO USUARIO CON PERFIL ====================

export class UsuarioConPerfilResponseDto extends UsuarioResponseDto {
  @ApiProperty({
    description: 'Perfil del usuario',
    type: PerfilResponseDto,
    required: false,
  })
  @Expose()
  @Type(() => PerfilResponseDto)
  perfil?: PerfilResponseDto;
}

// ==================== DTO USUARIO ADMIN ====================

export class UsuarioAdminResponseDto extends UsuarioConPerfilResponseDto {
  @ApiProperty({
    description: 'Fecha de verificación del email',
    required: false,
  })
  @Expose()
  fechaVerificacion?: Date;

  @ApiProperty({
    description: 'Fecha del último login',
    required: false,
  })
  @Expose()
  fechaUltimoLogin?: Date;

  @ApiProperty({ description: 'Número de intentos de login fallidos' })
  @Expose()
  intentosLogin: number;

  @ApiProperty({
    description: 'IP desde la cual se registró',
    required: false,
  })
  @Expose()
  ipRegistro?: string;

  @ApiProperty({
    description: 'User Agent del registro',
    required: false,
  })
  @Expose()
  userAgentRegistro?: string;

  @ApiProperty({
    description: 'Usuario que creó el registro',
    required: false,
  })
  @Expose()
  usuarioCreacion?: string;

  @ApiProperty({
    description: 'Usuario que modificó el registro',
    required: false,
  })
  @Expose()
  usuarioModificacion?: string;

  @ApiProperty({ description: 'Indica si el registro está activo' })
  @Expose()
  isActive: boolean;
}

// ==================== DTO RESPUESTA AVATAR ====================

export class AvatarResponseDto {
  @ApiProperty({ description: 'URL del avatar subido' })
  avatarUrl: string;

  @ApiProperty({ description: 'Nombre del archivo' })
  filename: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes' })
  size: number;
}

// ==================== DTO ESTADÍSTICAS ====================

export class EstadisticasUsuariosDto {
  @ApiProperty({ description: 'Total de usuarios registrados' })
  totalUsuarios: number;

  @ApiProperty({ description: 'Usuarios en estado activo' })
  usuariosActivos: number;

  @ApiProperty({ description: 'Usuarios pendientes de verificación' })
  usuariosPendientes: number;

  @ApiProperty({ description: 'Usuarios inactivos' })
  usuariosInactivos: number;

  @ApiProperty({ description: 'Usuarios suspendidos' })
  usuariosSuspendidos: number;

  @ApiProperty({ description: 'Registros del último mes' })
  registrosUltimoMes: number;

  @ApiProperty({ description: 'Usuarios con email verificado' })
  usuariosVerificados: number;
}
