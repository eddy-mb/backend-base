import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { TipoToken } from '../enums/auth.enums';

@Entity({ name: 'tokens_verificacion', schema: process.env.DB_SCHEMA_USUARIOS })
export class TokenVerificacion {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'token', unique: true })
  token: string;

  @Column({ name: 'email' })
  email: string;

  @Column({
    type: 'enum',
    enum: TipoToken,
  })
  tipo: TipoToken;

  @Column({ name: 'expira_en', type: 'timestamp' })
  expiraEn: Date;

  @Column({ name: 'usado', default: false })
  usado: boolean;

  // Métodos de utilidad
  estaExpirado(): boolean {
    return new Date() > this.expiraEn;
  }

  marcarComoUsado(): void {
    this.usado = true;
  }

  esValido(): boolean {
    return !this.usado && !this.estaExpirado();
  }
}
