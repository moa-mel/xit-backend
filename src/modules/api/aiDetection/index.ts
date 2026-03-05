import { Module } from '@nestjs/common';
import { AIDetectionController } from './controllers';
import { AIDetectionService } from './services';

@Module({
  providers: [AIDetectionService],
  controllers: [AIDetectionController],
  exports: [AIDetectionService],
})
export class AIDetectionModule {}
