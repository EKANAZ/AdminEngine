import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Interaction } from './Interaction';
@Entity('end_user')
export class ClientUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  Unique_id?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  branchId?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  whatsapp?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  bloodGroup?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column('jsonb', { nullable: true })
  phoneModel?: Record<string, any>;

  @Column('jsonb', { nullable: true   })
  bankList?: any[];

  @Column({ nullable: true })
  gstNo?: string;

  @Column({ nullable: true })
  companyName?: string;

  @Column('jsonb', { nullable: true })
  stateCode?: Record<string, any>;

  @Column({ default: 1 })
  active!: number;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  sync_status?: string;

  @Column({ nullable: true })
  version?: number;

  @Column({ nullable: true })
  last_updated?: string;

  @Column({ nullable: true })
  device_id?: string;

  @Column({ nullable: true })
  is_deleted?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => require('./Interaction').Interaction, (interaction: any) => interaction.clientUser)
  interactions!: Interaction[];
}
