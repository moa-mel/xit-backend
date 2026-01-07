import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { EmailModule } from "./email";
import { PodCastModule } from "./podcast";
import { LiveStreamModule } from "./liveStream";
import { ChatModule } from "./chat";

@Module({
  imports: [
    AuthModule, EmailModule, PodCastModule, LiveStreamModule, ChatModule
  ],
})
export class ApiModule {}