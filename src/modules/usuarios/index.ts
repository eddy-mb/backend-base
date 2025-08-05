// ==================== MÓDULO DE USUARIOS ====================
// Exportaciones principales del módulo de gestión de usuarios

// Módulo principal
export { UsuariosModule } from './usuarios.module';

// Entidades
export { Usuario } from './entities/usuario.entity';
export { EstadoUsuario } from './enums/usuario.enum';
export { PerfilUsuario } from './entities/perfil-usuario.entity';

export { ConfiguracionUsuario } from './interfaces/usuario.interface';

// Servicios principales
export { UsuariosService } from './services/usuarios.service';
export { AvatarService } from './services/avatar.service';

// DTOs de Request
export { CrearUsuarioDto } from './dto/request/crear-usuario.dto';
export { ActualizarPerfilDto } from './dto/request/perfil.dto';
export {
  CambiarPasswordDto,
  FiltrosUsuarioDto,
  CambiarEstadoUsuarioDto,
} from './dto/request/usuario.dto';

// DTOs de Response
export {
  UsuarioResponseDto,
  UsuarioConPerfilResponseDto,
  UsuarioAdminResponseDto,
  PerfilResponseDto,
  AvatarResponseDto,
  EstadisticasUsuariosDto,
} from './dto/response/usuario-response.dto';

// Repositories (para uso interno principalmente)
export { UsuarioRepository } from './repositories/usuario.repository';
export { PerfilUsuarioRepository } from './repositories/perfil-usuario.repository';

// Constants
export { AVATAR_CONFIG } from './constants/usuarios.constants';
