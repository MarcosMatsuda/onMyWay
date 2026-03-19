import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 8 })
  lat: number;

  @Column('decimal', { precision: 11, scale: 8 })
  lng: number;

  @Column({ name: 'geofence_radius_meters' })
  geofenceRadiusMeters: number;

  @Column({ name: 'notification_threshold_meters' })
  notificationThresholdMeters: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}