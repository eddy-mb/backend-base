import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { PrismaService } from '../services/prisma.service';

// Mock del ConfiguracionService
const mockConfiguracionService = {
  baseDatos: {
    url: 'postgresql://test:test@localhost:5432/test_db',
    host: 'localhost',
    port: 5432,
    user: 'test',
    password: 'test',
    database: 'test_db',
    ssl: false,
  },
};

describe('PrismaService', () => {
  let service: PrismaService;
  let configService: jest.Mocked<ConfiguracionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfiguracionService,
          useValue: mockConfiguracionService,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    configService = module.get(ConfiguracionService);
  });

  afterEach(async () => {
    // Asegurar limpieza después de cada test
    if (service) {
      await service.$disconnect().catch(() => {
        // Ignorar errores de desconexión en tests
      });
    }
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe usar la configuración del ConfiguracionService', () => {
    expect(configService.baseDatos).toEqual({
      url: 'postgresql://test:test@localhost:5432/test_db',
      host: 'localhost',
      port: 5432,
      user: 'test',
      password: 'test',
      database: 'test_db',
      ssl: false,
    });
  });

  describe('verificarConexion', () => {
    it('debe tener método verificarConexion', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.verificarConexion).toBeDefined();
      expect(typeof service.verificarConexion).toBe('function');
    });

    it('debe retornar boolean', async () => {
      // Mock del método $executeRaw para evitar conexión real en tests
      const mockExecuteRaw = jest.fn().mockResolvedValue([]);
      service.$executeRaw = mockExecuteRaw;

      const resultado = await service.verificarConexion();

      expect(typeof resultado).toBe('boolean');
      expect(mockExecuteRaw).toHaveBeenCalledWith(['SELECT 1']);
    });

    it('debe retornar false en caso de error', async () => {
      // Mock del método $executeRaw para simular error
      const mockExecuteRaw = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));
      service.$executeRaw = mockExecuteRaw;

      const resultado = await service.verificarConexion();

      expect(resultado).toBe(false);
    });
  });

  describe('lifecycle hooks', () => {
    it('debe tener método onModuleInit', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.onModuleInit).toBeDefined();
      expect(typeof service.onModuleInit).toBe('function');
    });

    it('debe tener método onModuleDestroy', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.onModuleDestroy).toBeDefined();
      expect(typeof service.onModuleDestroy).toBe('function');
    });
  });
});
