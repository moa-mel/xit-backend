import { Module } from "@nestjs/common";
import { FirebaseService } from "./services";

@Module({
  providers: [FirebaseService],
  exports: [FirebaseService], 
})
export class FirebaseModule {}