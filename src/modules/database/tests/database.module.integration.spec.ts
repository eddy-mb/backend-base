import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionModule } from '../../configuracion/configuracion.module';
import { DatabaseModule } from '../database.module';
import { PrismaService } from '../services/prisma.service';

describe('DatabaseModule (Integration)', () => {
  let module: TestingModule;
  let prismaService: PrismaService;

  beforeAll(async () => {
    // Configurar variables de entorno para testing
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-muy-largo-para-testing-seguro';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-muy-largo-para-testing';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.API_URL = 'http://localhost:3001';

    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('debe compilar el módulo correctamente', () => {
    expect(module).toBeDefined();
  });

  it('debe proporcionar PrismaService', () => {
    expect(prismaService).toBeDefined();
    expect(prismaService).toBeInstanceOf(PrismaService);
  });

  it('debe ser un módulo global', () => {
    const moduleMetadata = Reflect.getMetadata(
      'imports',
      DatabaseModule,
    ) as Array<typeof ConfiguracionModule>;
    expect(moduleMetadata).toContain(ConfiguracionModule);
  });

  it('debe exportar PrismaService para inyección', () => {
    // Verificar que PrismaService esté disponible para inyección
    expect(prismaService).toBeDefined();
    expect(typeof prismaService.verificarConexion).toBe('function');
  });

  it('PrismaService debe tener métodos de lifecycle', () => {
    expect(typeof prismaService.onModuleInit).toBe('function');
    expect(typeof prismaService.onModuleDestroy).toBe('function');
  });

  it('PrismaService debe tener métodos básicos de Prisma', () => {
    expect(typeof prismaService.$connect).toBe('function');
    expect(typeof prismaService.$disconnect).toBe('function');
    expect(typeof prismaService.$executeRaw).toBe('function');
  });
});
