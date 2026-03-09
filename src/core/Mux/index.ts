import { Module } from "@nestjs/common";
import { FirebaseService } from "./services";

@Module({
  providers: [MuxService],
  exports: [MuxService], 
})
export class MuxModule {}