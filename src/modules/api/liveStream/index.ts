import { Module } from "@nestjs/common";
import { LiveStreamController } from "./controllers";
import { LiveStreamService } from "./services";
import { NotificationModule } from "../notification";
import { BullModule } from "@nestjs/bull";
import { BULL_QUEUES } from "@/bull/constants";
import { AgoraModule } from "@/core/agora";
import { AIDetectionModule } from "../aiDetection";


@Module({
  imports: [
    NotificationModule, 
    AIDetectionModule,
    BullModule.registerQueue({
      name: BULL_QUEUES.NOTIFICATION,
    }),
    AgoraModule,
  ],
  providers: [LiveStreamService],
  controllers: [ LiveStreamController],
  exports: [BullModule],
})
export class LiveStreamModule {}