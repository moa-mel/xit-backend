import { Module } from '@nestjs/common';
import { NotificationController } from './controllers';
import { NotificationService } from './services';
import { BULL_QUEUES } from '@/bull/constants';
import { NotificationProcessor } from './queues/processors';
import { BullModule } from '@nestjs/bull';
import { FirebaseService } from '@/core/firebase/services';

@Module({
  imports: [BullModule.registerQueue({ name: BULL_QUEUES.NOTIFICATION })],
  providers: [NotificationService, NotificationProcessor, FirebaseService,],
  controllers: [NotificationController],
  exports: [BullModule],
})
export class NotificationModule {}