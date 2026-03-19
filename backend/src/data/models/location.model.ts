import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('locations')
export class LocationModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  @Index()
  parentId: string;

  @Column('decimal', { precision: 10, scale: 8 })
  lat: number;

  @Column('decimal', { precision: 11, scale: 8 })
  lng: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  point: string;

  @Column('float', { nullable: true })
  accuracy: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
