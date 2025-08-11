import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Entidad para persistir reglas de Casbin
 */
@Entity({ name: 'casbin_rule', schema: process.env.DB_SCHEMA_USUARIOS })
@Index(['ptype'])
@Index(['v0'])
@Index(['v1'])
export class CasbinRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'ptype',
    type: 'varchar',
    length: 100,
    comment: 'Tipo de política (p=policy, g=grouping)',
  })
  ptype: string;

  @Column({
    name: 'v0',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Sujeto (rol o usuario)',
  })
  v0: string;

  @Column({
    name: 'v1',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Objeto (recurso o ruta)',
  })
  v1: string;

  @Column({
    name: 'v2',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Acción (GET, POST, PUT, DELETE)',
  })
  v2: string;

  @Column({
    name: 'v3',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  v3: string;

  @Column({
    name: 'v4',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  v4: string;

  @Column({
    name: 'v5',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  v5: string;
}
