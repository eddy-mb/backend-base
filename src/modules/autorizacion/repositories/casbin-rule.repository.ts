import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CasbinRule } from '../entities/casbin-rule.entity';

@Injectable()
export class CasbinRuleRepository {
  constructor(
    @InjectRepository(CasbinRule)
    private readonly repository: Repository<CasbinRule>,
  ) {}

  async findAllPolicies(): Promise<CasbinRule[]> {
    return this.repository.find({
      where: { ptype: 'p' },
      order: { v0: 'ASC', v1: 'ASC' },
    });
  }

  async findAllGroupings(): Promise<CasbinRule[]> {
    return this.repository.find({
      where: { ptype: 'g' },
      order: { v0: 'ASC' },
    });
  }

  async findPoliciesByRole(role: string): Promise<CasbinRule[]> {
    return this.repository.find({
      where: { ptype: 'p', v0: role },
      order: { v1: 'ASC' },
    });
  }

  async createPolicy(
    role: string,
    resource: string,
    action: string,
  ): Promise<CasbinRule> {
    const rule = this.repository.create({
      ptype: 'p',
      v0: role,
      v1: resource,
      v2: action,
    });
    return this.repository.save(rule);
  }

  async createGrouping(userId: string, role: string): Promise<CasbinRule> {
    const rule = this.repository.create({
      ptype: 'g',
      v0: userId,
      v1: role,
    });
    return this.repository.save(rule);
  }

  async deletePolicy(
    role: string,
    resource: string,
    action: string,
  ): Promise<void> {
    await this.repository.delete({
      ptype: 'p',
      v0: role,
      v1: resource,
      v2: action,
    });
  }

  async deleteGrouping(userId: string, role: string): Promise<void> {
    await this.repository.delete({
      ptype: 'g',
      v0: userId,
      v1: role,
    });
  }

  async deleteAllGroupingsByUserId(userId: string): Promise<void> {
    await this.repository.delete({
      ptype: 'g',
      v0: userId,
    });
  }

  async existsPolicy(
    role: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        ptype: 'p',
        v0: role,
        v1: resource,
        v2: action,
      },
    });
    return count > 0;
  }
}
