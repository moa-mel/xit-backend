import { Module } from '@nestjs/common';
import { NotificationController } from './controllers';
import { NotificationService } from './services';
import { BULL_QUEUES } from '@/bull/constants';
import { NotificationProcessor } from './queues/processors';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [BullModule.registerQueue({ name: BULL_QUEUES.NOTIFICATION })],
  providers: [NotificationService, NotificationProcessor],
  controllers: [NotificationController],
  exports: [BullModule],
})
export class NotificationModule {}