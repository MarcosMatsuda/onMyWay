import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id' })
  @Index()
  parentId: string;

  @Column('decimal', { precision: 10, scale: 8 })
  lat: number;

  @Column('decimal', { precision: 11, scale: 8 })
  lng: number;

  @Column('decimal', { precision: 5, scale: 2 })
  accuracy: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;
}
