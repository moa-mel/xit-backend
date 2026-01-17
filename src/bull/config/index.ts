import { redisHost, redisPassword, redisPort, redisUsername } from '@/config';
import { BullModuleOptions } from '@nestjs/bull';

const redisOptions: any = {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    username: redisUsername,
    // Add retry strategy for Bull
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 5000);
        console.warn(`[Bull] Retrying Redis connection in ${delay}ms`);
        return delay;
    },
};

// Only add TLS configuration if explicitly needed
if (process.env.REDIS_TLS === 'true') {
    redisOptions.tls = {
        rejectUnauthorized: false
    };
}

export const bullConfig: BullModuleOptions = {
    redis: redisOptions
};