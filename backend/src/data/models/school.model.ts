import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('schools')
export class SchoolModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

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
  location: string;

  @Column({
    name: 'geofence_radius_meters',
    type: 'integer',
    default: 1000,
  })
  geofenceRadiusMeters: number;

  @Column({
    name: 'notification_threshold_meters',
    type: 'integer',
    default: 500,
  })
  notificationThresholdMeters: number;

  @Column({
    name: 'invite_code',
    length: 8,
    unique: true,
    nullable: true,
  })
  inviteCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
