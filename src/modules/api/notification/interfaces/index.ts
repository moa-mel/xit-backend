export enum NotificationJobType {
  LIVESTREAM = 'LIVESTREAM',
  PODCAST = 'PODCAST',
  GENERAL = 'GENERAL',
}

export interface CreateNotificationJob {
  type: NotificationJobType;
  liveStreamId?: number;
  podcastId?: number;
}