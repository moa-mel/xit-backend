import { Module } from '@nestjs/common';
import { AgoraService } from './services';

@Module({
  providers: [AgoraService],
  exports: [AgoraService],
})
export class AgoraModule {}
