import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('etas')
export class ETAModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  @Index()
  parentId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId: string;

  @Column({ name: 'distance_meters', type: 'integer' })
  distanceMeters: number;

  @Column({ name: 'duration_seconds', type: 'integer' })
  durationSeconds: number;

  @Column('text', { name: 'route_polyline' })
  routePolyline: string;

  @Column({
    name: 'calculated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  calculatedAt: Date;
}
