import { Module } from "@nestjs/common";
import { PodCastController } from "./controllers";
import { PodCastService } from "./services";
import { BullModule } from "@nestjs/bull";
import { BULL_QUEUES } from "@/bull/constants";
import { NotificationModule } from "../notification";


@Module({
  imports: [
    NotificationModule,
    BullModule.registerQueue({
      name: BULL_QUEUES.NOTIFICATION,
    }),
  ],
  providers: [PodCastService],
  controllers: [PodCastController],
  exports: [BullModule],
})
export class PodCastModule { }