import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ChatService } from "./services";
import { ChatController } from "./controllers";
import { NotificationModule } from "../notification";
import { BULL_QUEUES } from "@/bull/constants";


@Module({
  imports: [
    NotificationModule,
    BullModule.registerQueue({
      name: BULL_QUEUES.NOTIFICATION,
    }),
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [BullModule],
})
export class ChatModule { }