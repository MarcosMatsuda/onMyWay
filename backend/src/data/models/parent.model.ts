import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('parents')
export class ParentModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}