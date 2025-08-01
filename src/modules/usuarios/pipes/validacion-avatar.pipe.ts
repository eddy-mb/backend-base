import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { AVATAR_CONFIG } from '../constants/usuarios.constants';

@Injectable()
export class ValidacionAvatarPipe
  implements PipeTransform<Express.Multer.File>
{
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo');
    }

    // Validar tipo MIME
    if (
      !(AVATAR_CONFIG.TIPOS_PERMITIDOS as readonly string[]).includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos válidos: ${AVATAR_CONFIG.TIPOS_PERMITIDOS.join(', ')}`,
      );
    }

    // Validar tamaño
    if (file.size > AVATAR_CONFIG.TAMANO_MAXIMO) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Tamaño máximo: ${AVATAR_CONFIG.TAMANO_MAXIMO / 1024 / 1024}MB`,
      );
    }

    // Validar extensión
    const extension = this.obtenerExtension(file.originalname);
    if (
      !(AVATAR_CONFIG.EXTENSIONES_PERMITIDAS as readonly string[]).includes(
        extension.toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        `Extensión de archivo no permitida. Extensiones válidas: ${AVATAR_CONFIG.EXTENSIONES_PERMITIDAS.join(', ')}`,
      );
    }

    // Validar que sea realmente una imagen (header básico)
    if (!this.esImagenValida(file.buffer)) {
      throw new BadRequestException(
        'El archivo no parece ser una imagen válida',
      );
    }

    return file;
  }

  private obtenerExtension(nombreArchivo: string): string {
    const puntoIndex = nombreArchivo.lastIndexOf('.');
    return puntoIndex !== -1 ? nombreArchivo.substring(puntoIndex) : '';
  }

  private esImagenValida(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    const header = buffer.subarray(0, 4);

    // JPEG: FF D8 FF
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47
    if (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    ) {
      return true;
    }

    // WebP: RIFF + WEBP
    if (buffer.length >= 12) {
      const riff = buffer.subarray(0, 4);
      const webp = buffer.subarray(8, 12);

      if (riff.toString() === 'RIFF' && webp.toString() === 'WEBP') {
        return true;
      }
    }

    return false;
  }
}
