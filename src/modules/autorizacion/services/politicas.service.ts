import { Injectable, Logger } from '@nestjs/common';
import { CasbinRuleRepository } from '../repositories/casbin-rule.repository';
import { CrearPoliticaDto } from '../dto/autorizacion.dto';

@Injectable()
export class PoliticasService {
  private readonly logger = new Logger(PoliticasService.name);

  constructor(private readonly casbinRuleRepository: CasbinRuleRepository) {}

  async crearPolitica(dto: CrearPoliticaDto): Promise<boolean> {
    const exists = await this.casbinRuleRepository.existsPolicy(
      dto.rol,
      dto.ruta,
      dto.accion,
    );
    if (exists) {
      return false;
    }

    await this.casbinRuleRepository.createPolicy(dto.rol, dto.ruta, dto.accion);
    this.logger.log(
      `Política creada: ${dto.rol} -> ${dto.ruta} (${dto.accion})`,
    );
    return true;
  }

  async eliminarPolitica(
    rol: string,
    ruta: string,
    accion: string,
  ): Promise<boolean> {
    const exists = await this.casbinRuleRepository.existsPolicy(
      rol,
      ruta,
      accion,
    );
    if (!exists) {
      return false;
    }

    await this.casbinRuleRepository.deletePolicy(rol, ruta, accion);
    this.logger.log(`Política eliminada: ${rol} -> ${ruta} (${accion})`);
    return true;
  }

  async obtenerTodasLasPoliticas(): Promise<
    Array<{ rol: string; ruta: string; accion: string }>
  > {
    const rules = await this.casbinRuleRepository.findAllPolicies();
    return rules.map((rule) => ({
      rol: rule.v0,
      ruta: rule.v1,
      accion: rule.v2,
    }));
  }

  async obtenerPoliticasRol(
    rol: string,
  ): Promise<Array<{ ruta: string; accion: string }>> {
    const rules = await this.casbinRuleRepository.findPoliciesByRole(rol);
    return rules.map((rule) => ({
      ruta: rule.v1,
      accion: rule.v2,
    }));
  }

  async asignarRolAUsuario(usuarioId: string, rol: string): Promise<void> {
    await this.casbinRuleRepository.createGrouping(usuarioId, rol);
    this.logger.log(
      `Rol asignado en Casbin: usuario ${usuarioId} -> rol ${rol}`,
    );
  }

  async removerRolDeUsuario(usuarioId: string, rol: string): Promise<void> {
    await this.casbinRuleRepository.deleteGrouping(usuarioId, rol);
    this.logger.log(
      `Rol removido en Casbin: usuario ${usuarioId} -> rol ${rol}`,
    );
  }

  async sincronizarRolesUsuario(
    usuarioId: string,
    roles: string[],
  ): Promise<void> {
    // Limpiar asignaciones existentes
    await this.casbinRuleRepository.deleteAllGroupingsByUserId(usuarioId);

    // Crear nuevas asignaciones
    for (const rol of roles) {
      await this.casbinRuleRepository.createGrouping(usuarioId, rol);
    }

    this.logger.log(
      `Roles sincronizados para usuario ${usuarioId}: [${roles.join(', ')}]`,
    );
  }
}
