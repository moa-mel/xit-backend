import { Module } from '@nestjs/common';
import { AuthController } from './controllers';
import { AuthService } from './services';
import { jwtExpiresIn, jwtSecret } from '@/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpiresIn as any },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}