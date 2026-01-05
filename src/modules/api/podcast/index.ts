import { Module } from "@nestjs/common";
import { PodCastController } from "./controllers";
import { PodCastService } from "./services";


@Module({
  imports: [ ],
  providers: [PodCastService],
  controllers: [ PodCastController],
  exports: [],
})
export class PodCastodule {}