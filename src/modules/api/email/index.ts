import { Module } from "@nestjs/common";
import { EmailService } from "./services";


@Module({
  imports: [],
  providers: [EmailService],
})

export class EmailModule {}
  