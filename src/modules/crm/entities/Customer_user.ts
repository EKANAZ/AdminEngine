import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from '../../../models/Company';
import { Role } from '../../../models/Role';
import { Interaction } from './Interaction';

@Entity('users_client')
export class users_client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  lastLoginAt!: Date;

  @Column({ nullable: true })
  passwordResetToken!: string;

  @Column({ nullable: true })
  passwordResetExpires!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @ManyToOne(() => Company, company => company.users)
  @JoinColumn({ name: 'company_id' })
  company!: Company;
  @OneToMany(() => Interaction, interaction => interaction.customer)
  interactions!: Interaction[];
  @OneToMany(() => Role, role => role.user)
  roles!: Role[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  branchId?: string;

  @Column('jsonb', { nullable: true })
  phoneModel?: Record<string, any>;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ default: true })
  active!: boolean;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  Unique_id?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  whatsapp?: string;

  @Column({ nullable: true })
  bloodGroup?: string;

  @Column('jsonb', { nullable: true })
  bankList?: any[];

  @Column({ nullable: true })
  gstNo?: string;

  @Column({ nullable: true })
  companyName?: string;

  @Column('jsonb', { nullable: true })
  stateCode?: Record<string, any>;

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
} 