import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfiguracionService } from '../services/configuracion.service';

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfiguracionService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ConfiguracionService>(ConfiguracionService);
    configService = module.get(ConfigService);
  });

  describe('cargarYValidarConfiguracion', () => {
    it('debe cargar configuración válida correctamente', () => {
      // Arrange
      configService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          const config: Record<string, string> = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
            NODE_ENV: 'test',
            PORT: '3001',
            FRONTEND_URL: 'http://localhost:3000',
            API_URL: 'http://localhost:3001',
            JWT_SECRET: 'test-jwt-secret-muy-largo-para-seguridad-123456789',
            ENCRYPTION_KEY:
              'test-encryption-key-muy-largo-para-seguridad-123456789',
            APP_NAME: 'Test App',
            APP_VERSION: '1.0.0',
          };
          return config[key] || defaultValue;
        },
      );

      // Act & Assert
      expect(() => service.onModuleInit()).not.toThrow();
      expect(service.aplicacion.ambiente).toBe('test');
    });

    it('debe lanzar error con configuración inválida', () => {
      // Arrange
      configService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          if (key === 'JWT_SECRET') return 'muy-corto'; // Inválido
          return defaultValue;
        },
      );

      // Act & Assert
      expect(() => service.onModuleInit()).toThrow('Configuración inválida');
    });
  });

  describe('caracteristicaHabilitada', () => {
    beforeEach(() => {
      configService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          const config: Record<string, string> = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
            NODE_ENV: 'test',
            JWT_SECRET: 'test-jwt-secret-muy-largo-para-seguridad-123456789',
            ENCRYPTION_KEY:
              'test-encryption-key-muy-largo-para-seguridad-123456789',
            RESEND_API_KEY: 'test-resend-key',
            FRONTEND_URL: 'http://localhost:3000',
            API_URL: 'http://localhost:3001',
            APP_NAME: 'Test App',
            APP_VERSION: '1.0.0',
          };
          return config[key] || defaultValue;
        },
      );

      service.onModuleInit();
    });

    it('debe retornar true para característica habilitada', () => {
      expect(service.caracteristicaHabilitada('email')).toBe(true);
    });

    it('debe retornar false para característica no habilitada', () => {
      expect(service.caracteristicaHabilitada('s3')).toBe(false);
    });
  });
});
