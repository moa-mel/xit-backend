import { Module } from "@nestjs/common";
import { GoogleService } from "./services";
import { ConfigModule } from "@nestjs/config";


@Module({
  imports: [ConfigModule],
  providers: [GoogleService],
  exports: [GoogleService],
})

export class GoogleModule {}