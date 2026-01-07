import { BULL_QUEUES } from '@/bull/constants';
import { Process, Processor } from '@nestjs/bull';
import { NotificationQueue } from '../interfaces';
import { NotificationService } from '../../services';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CreateNotificationJob, NotificationJobType } from '../../interfaces';

@Processor(BULL_QUEUES.NOTIFICATION)
export class NotificationProcessor {
  constructor(private notificationService: NotificationService) {}

  @Process(NotificationQueue.NOTIFICATION_CREATE)
  async handleNotificationCreation(job: Job<CreateNotificationJob>) {
    const { type, liveStreamId, podcastId } = job.data;
    
    Logger.log(
      `Processing notification creation for type: ${type}, jobId: ${job.id}`,
    );

    try {
      switch (type) {
        case NotificationJobType.LIVESTREAM:
          if (!liveStreamId) {
            throw new Error('liveStreamId is required for LIVESTREAM notification');
          }
          await this.notificationService.notifyUsersAboutLiveStream(
            liveStreamId,
          );
          break;

        case NotificationJobType.PODCAST:
          if (!podcastId) {
            throw new Error('podcastId is required for PODCAST notification');
          }
          await this.notificationService.notifyUsersAboutPodcast(podcastId);
          break;

        case NotificationJobType.GENERAL:
          // Handle general notifications if needed
          Logger.log('General notification processing not implemented yet');
          break;

        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      Logger.log(`Successfully processed notification job ${job.id}`);
      return true;
    } catch (error) {
      Logger.error(
        `Failed to process notification job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }
}