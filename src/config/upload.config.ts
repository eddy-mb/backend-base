// src/config/upload.config.ts

import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface UploadOptionsParams {
  subfolder: string;
  mimeTypes: readonly string[];
  maxSizeMB: number;
  prefix?: string;
}

export const createMulterOptions = (
  configService: ConfigService,
  options: UploadOptionsParams,
) => {
  const uploadsPath = configService.get<string>('STORAGE_PATH', './uploads');
  const folderPath = join(process.cwd(), uploadsPath, options.subfolder);

  // Asegurarse de que el directorio exista
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, folderPath);
      },
      filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const uuid = uuidv4().split('-')[0];
        const ext = extname(file.originalname);
        const prefix = options.prefix || 'file';
        cb(null, `${prefix}_${timestamp}_${uuid}${ext}`);
      },
    }),
    limits: {
      fileSize: options.maxSizeMB, // MB → bytes
    },
    fileFilter: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (options.mimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no permitido'), false);
      }
    },
  };
};
