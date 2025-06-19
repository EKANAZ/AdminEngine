import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { CompanyModule } from './CompanyModule';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  domain: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  metadata: {
    databaseName?: string;
    databaseUser?: string;
    databasePassword?: string;
    settings?: {
      theme?: string;
      language?: string;
      timezone?: string;
    };
  };

  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => CompanyModule, companyModule => companyModule.company)
  modules: CompanyModule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 