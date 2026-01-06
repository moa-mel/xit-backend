import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { EmailModule } from "./email";
import { PodCastModule } from "./podcast";
import { LiveStreamModule } from "./liveStream";

@Module({
  imports: [
    AuthModule, EmailModule, PodCastModule, LiveStreamModule
  ],
})
export class ApiModule {}