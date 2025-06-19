import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './Customer';

@Entity('interactions')
export class Interaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'email' | 'call' | 'meeting' | 'note' | 'other';

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';

  @Column('jsonb', { nullable: true })
  metadata: {
    duration?: number;
    participants?: string[];
    followUpDate?: Date;
    customFields?: Record<string, any>;
  };

  @ManyToOne(() => Customer, customer => customer.interactions)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 