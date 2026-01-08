import { BULL_QUEUES } from '@/bull/constants';
import { Process, Processor } from '@nestjs/bull';
import { NotificationQueue } from '../interfaces';
import { NotificationService } from '../../services';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CreateNotificationJob, NotificationJobType } from '../../interfaces';
import { FirebaseService } from '@/core/firebase/services';

@Processor(BULL_QUEUES.NOTIFICATION)
export class NotificationProcessor {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly firebaseService: FirebaseService,
  ) { }

  @Process(NotificationQueue.NOTIFICATION_CREATE)
  async handleNotificationCreation(job: Job<CreateNotificationJob>) {
    const { type, liveStreamId, podcastId } = job.data;

    Logger.log(
      `Processing notification creation for type: ${type}, jobId: ${job.id}`,
    );

    try {
      let notifications: any[] = [];

      switch (type) {
        case NotificationJobType.LIVESTREAM: {
          if (!liveStreamId) {
            throw new Error(
              'liveStreamId is required for LIVESTREAM notification',
            );
          }

          notifications =
            await this.notificationService.notifyUsersAboutLiveStream(
              liveStreamId,
            );
          break;
        }

        case NotificationJobType.PODCAST: {
          if (!podcastId) {
            throw new Error(
              'podcastId is required for PODCAST notification',
            );
          }

          notifications =
            await this.notificationService.notifyUsersAboutPodcast(podcastId);
          break;
        }

        case NotificationJobType.GENERAL: {
          // Handle general notifications if needed
          Logger.log('General notification processing not implemented yet');

        }

        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      for (const notification of notifications) {
        const firebasePath = `notifications/${notification.userId}`;

        await this.firebaseService.sendRealtimeUpdate(firebasePath, {
          id: notification.id,
          title: notification.title,
          description: notification.description,
          type: notification.type,
          liveStreamId: notification.liveStreamId ?? null,
          podcastId: notification.podcastId ?? null,
          createdAt: notification.createdAt,
          read: false,
        });
      }

      Logger.log(`Successfully processed notification job ${job.id}`);
      return true;
    } catch (error) {
      Logger.error(
        `Failed to process notification job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error; 
    }
  }
}
