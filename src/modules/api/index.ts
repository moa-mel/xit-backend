import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { EmailModule } from "./email";
import { PodCastodule } from "./podcast";
import { LiveStreamModule } from "./liveStream";

@Module({
  imports: [
    AuthModule, EmailModule, PodCastodule, LiveStreamModule
  ],
})
export class ApiModule {}