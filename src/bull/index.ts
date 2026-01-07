import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { bullConfig } from "./config";

@Module({
  imports: [BullModule.forRoot(bullConfig)],
  exports: [BullModule],
})
export class BullModuleConfig {}