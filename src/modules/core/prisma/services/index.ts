import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import logger from 'moment-logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    logger.log('Connecting to the database...');
    await this.$connect();
    logger.info('Connected to the database');
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      logger.warn('Prisma detected beforeExit – closing NestJS app...');
      await app.close();
    });
  }
}

