import { UserController } from "./controllers";
import { UserService } from "./services";
import { Module } from '@nestjs/common';

@Module({
  imports: [ ],
  providers: [UserService],
  controllers: [UserController],
  exports: [],
})
export class UserModule {}