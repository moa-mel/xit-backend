import { Module } from '@nestjs/common';
import { AuthController } from './controllers';
import { AuthService } from './services';
import { jwtExpiresIn, jwtSecret } from '@/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email';

@Module({
  imports: [
    EmailModule,
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