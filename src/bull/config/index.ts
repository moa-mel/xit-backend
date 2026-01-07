import { redisHost, redisPassword, redisPort } from '@/config';
import { BullModuleOptions } from '@nestjs/bull';

export const bullConfig: BullModuleOptions = {
    redis: {
        host: redisHost,
        port: redisPort,
        password: redisPassword,
    },
};