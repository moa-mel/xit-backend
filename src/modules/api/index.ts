import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { EmailModule } from "./email";
import { PodCastModule } from "./podcast";
import { LiveStreamModule } from "./liveStream";
import { ChatModule } from "./chat";
import { AIDetectionModule } from "./aiDetection";
import { UserModule } from "./user";

@Module({
  imports: [
    AuthModule, UserModule, EmailModule, PodCastModule, LiveStreamModule, ChatModule, AIDetectionModule
  ],
})
export class ApiModule {}