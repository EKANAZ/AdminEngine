import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Company } from './Company';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  planName!: string; // e.g., 'Free', 'Pro', 'Enterprise'

  @Column()
  status!: string; // e.g., 'active', 'expired', 'canceled'

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @ManyToOne(() => Company, company => company.subscriptions)
  company!: Company;
} 