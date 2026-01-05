import { Module } from "@nestjs/common";
import { LiveStreamController } from "./controllers";
import { LiveStreamService } from "./services";


@Module({
  imports: [ ],
  providers: [LiveStreamService],
  controllers: [ LiveStreamController],
  exports: [],
})
export class LiveStreamModule {}