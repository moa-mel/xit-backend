import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum NotificationType {
  LIVESTREAM = 'LIVESTREAM',
  PODCAST = 'PODCAST',
  GENERAL = 'GENERAL',
}

export class FetchNotificationsDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  // Only one of these should be provided based on type
  @IsOptional()
  liveStreamId?: number;

  @IsOptional()
  podcastId?: number;
}