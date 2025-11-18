import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisIntegration');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('redis_url');
        logger.debug(`Connecting to Redis at .....`);
        return {
          url,
          type: 'single',
          tls: {
            rejectUnauthorized: true,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class RedisIntegrationModule {}
