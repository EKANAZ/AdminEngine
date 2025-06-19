import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Contact } from './Contact';
import { Interaction } from './Interaction';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'lead';

  @Column('jsonb', { nullable: true })
  metadata: {
    industry?: string;
    size?: string;
    source?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };

  @OneToMany(() => Contact, contact => contact.customer)
  contacts: Contact[];

  @OneToMany(() => Interaction, interaction => interaction.customer)
  interactions: Interaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 