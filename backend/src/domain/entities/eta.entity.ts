import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('etas')
export class ETA {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id' })
  @Index()
  parentId: string;

  @Column({ name: 'school_id' })
  @Index()
  schoolId: string;

  @Column({ name: 'distance_meters' })
  distanceMeters: number;

  @Column({ name: 'duration_seconds' })
  durationSeconds: number;

  @Column('text', { name: 'route_polyline' })
  routePolyline: string;

  @Column({ name: 'calculated_at', type: 'timestamp' })
  calculatedAt: Date;
}
