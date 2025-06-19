import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './Company';
import { Module } from './Module';

@Entity('company_modules')
export class CompanyModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, company => company.modules)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Module, module => module.companyModules)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  settings: {
    features: Record<string, boolean>;
    customizations: Record<string, any>;
    limits: Record<string, number>;
  };

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 