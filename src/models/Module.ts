import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CompanyModule } from './CompanyModule';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  version: string;

  @Column()
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb')
  config: {
    dependencies: string[];
    features: string[];
    settings: Record<string, any>;
    pricing: {
      monthly: number;
      yearly: number;
      features: Record<string, boolean>;
    };
  };

  @OneToMany(() => CompanyModule, companyModule => companyModule.module)
  companyModules: CompanyModule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 