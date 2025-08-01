import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../../logging/services/logger.service';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { AVATAR_CONFIG } from '../constants/usuarios.constants';

@Injectable()
export class AvatarService {
  private readonly directorioAvatares: string;
  private readonly baseUrl: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly configuracionService: ConfiguracionService,
  ) {
    const uploadsPath =
      this.configuracionService.storage.storagePath || './uploads';
    this.directorioAvatares = join(
      process.cwd(),
      uploadsPath,
      AVATAR_CONFIG.DIRECTORIO,
    );
    this.baseUrl =
      this.configuracionService.aplicacion.apiUrl || 'http://localhost:3001';

    void this.crearDirectorioSiNoExiste();
  }

  // ==================== VALIDACIÓN DE ARCHIVOS ====================

  validarArchivo(archivo: Express.Multer.File): void {
    // Validar tipo MIME
    if (
      !(AVATAR_CONFIG.TIPOS_PERMITIDOS as readonly string[]).includes(
        archivo.mimetype,
      )
    ) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos válidos: ${AVATAR_CONFIG.TIPOS_PERMITIDOS.join(', ')}`,
      );
    }

    // Validar tamaño
    if (archivo.size > AVATAR_CONFIG.TAMANO_MAXIMO) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Tamaño máximo: ${AVATAR_CONFIG.TAMANO_MAXIMO / 1024 / 1024}MB`,
      );
    }

    // Validar extensión
    const extension = this.obtenerExtension(archivo.originalname);
    if (
      !(AVATAR_CONFIG.EXTENSIONES_PERMITIDAS as readonly string[]).includes(
        extension.toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        `Extensión de archivo no permitida. Extensiones válidas: ${AVATAR_CONFIG.EXTENSIONES_PERMITIDAS.join(', ')}`,
      );
    }

    // Validar header de imagen
    if (!this.esImagenValida(archivo.buffer)) {
      throw new BadRequestException('El archivo no es una imagen válida');
    }
  }

  // ==================== GESTIÓN DE ARCHIVOS ====================

  async guardarAvatar(
    usuarioId: string,
    archivo: Express.Multer.File,
  ): Promise<{ nombreArchivo: string; url: string; tamano: number }> {
    this.logger.log(
      `Guardando avatar para usuario: ${usuarioId}`,
      'AvatarService',
    );

    try {
      this.validarArchivo(archivo);

      const extension = this.obtenerExtension(archivo.originalname);
      const nombreArchivo = this.generarNombreUnico(usuarioId, extension);
      const rutaCompleta = join(this.directorioAvatares, nombreArchivo);

      await fs.writeFile(rutaCompleta, archivo.buffer);

      const url = this.construirUrl(nombreArchivo);

      this.logger.log(`Avatar guardado: ${nombreArchivo}`, 'AvatarService');

      return { nombreArchivo, url, tamano: archivo.size };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al guardar avatar ${usuarioId}: ${error.message}`,
          error.stack,
          'AvatarService',
        );
      }

      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error interno al procesar el avatar',
      );
    }
  }

  async eliminarAvatar(nombreArchivo: string): Promise<void> {
    try {
      const rutaCompleta = join(this.directorioAvatares, nombreArchivo);
      await fs.access(rutaCompleta);
      await fs.unlink(rutaCompleta);

      this.logger.log(`Avatar eliminado: ${nombreArchivo}`, 'AvatarService');
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al eliminar avatar ${nombreArchivo}: ${error.message}`,
          error.stack,
          'AvatarService',
        );
      }

      throw new InternalServerErrorException(
        'Error interno al eliminar el avatar',
      );
    }
  }

  async existeAvatar(nombreArchivo: string): Promise<boolean> {
    try {
      const rutaCompleta = join(this.directorioAvatares, nombreArchivo);
      await fs.access(rutaCompleta);
      return true;
    } catch {
      return false;
    }
  }

  construirUrl(nombreArchivo: string): string {
    return `${this.baseUrl}/uploads/${AVATAR_CONFIG.DIRECTORIO}/${nombreArchivo}`;
  }

  async limpiarAvataresTorfanos(nombresEnUso: string[]): Promise<number> {
    try {
      const archivos = await fs.readdir(this.directorioAvatares);
      let eliminados = 0;

      for (const archivo of archivos) {
        if (
          !this.esNombreAvatarValido(archivo) ||
          nombresEnUso.includes(archivo)
        ) {
          continue;
        }

        await this.eliminarAvatar(archivo);
        eliminados++;
      }

      this.logger.log(`Avatares eliminados: ${eliminados}`, 'AvatarService');
      return eliminados;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error en limpieza: ${error.message}`,
          error.stack,
          'AvatarService',
        );
      }
      return 0;
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async crearDirectorioSiNoExiste(): Promise<void> {
    try {
      await fs.access(this.directorioAvatares);
    } catch {
      try {
        await fs.mkdir(this.directorioAvatares, { recursive: true });
        this.logger.log(
          `Directorio creado: ${this.directorioAvatares}`,
          'AvatarService',
        );
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Error crear directorio: ${error.message}`,
            error.stack,
            'AvatarService',
          );
        }
      }
    }
  }

  private generarNombreUnico(usuarioId: string, extension: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    return `avatar_${usuarioId}_${timestamp}_${uuid}${extension}`;
  }

  private obtenerExtension(nombreArchivo: string): string {
    const puntoIndex = nombreArchivo.lastIndexOf('.');
    return puntoIndex !== -1 ? nombreArchivo.substring(puntoIndex) : '';
  }

  private esImagenValida(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    const header = buffer.subarray(0, 4);

    // JPEG: FF D8 FF
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff)
      return true;

    // PNG: 89 50 4E 47
    if (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    )
      return true;

    // WebP: RIFF + WEBP
    if (buffer.length >= 12) {
      const riff = buffer.subarray(0, 4);
      const webp = buffer.subarray(8, 12);
      if (riff.toString() === 'RIFF' && webp.toString() === 'WEBP') return true;
    }

    return false;
  }

  private esNombreAvatarValido(nombreArchivo: string): boolean {
    return /^avatar_\d+_\d+_[a-f0-9]{8}\.(jpg|jpeg|png|webp)$/i.test(
      nombreArchivo,
    );
  }
}
