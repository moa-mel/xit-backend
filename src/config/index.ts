import validate, {
  RequiredEnvironment,
  RequiredEnvironmentTypes,
} from '@boxpositron/vre';

import { config } from 'dotenv';

config();

const runtimeEnvironment: RequiredEnvironment[] = [
  {
    name: 'PORT',
    type: RequiredEnvironmentTypes.Number,
  },
  {
    name: 'ALLOWED_DOMAINS',
    type: RequiredEnvironmentTypes.String,
  },

  {
    name: 'JWT_SECRET',
    type: RequiredEnvironmentTypes.String,
  },
  {
    name: 'REFRESH_JWT_SECRET',
    type: RequiredEnvironmentTypes.String,
  },
  {
    name: 'JWT_SECRET_EXPIRES',
    type: RequiredEnvironmentTypes.String,
  },
  {
    name: 'REFRESH_JWT_SECRET_EXPIRES',
    type: RequiredEnvironmentTypes.String,
  },
];

validate(runtimeEnvironment);

export const allowedDomains =
  process.env.ALLOWED_DOMAINS && process.env.ALLOWED_DOMAINS.split(',');
export const isProduction: boolean = process.env.NODE_ENV === 'production';
export const port: number = parseInt(process.env.PORT ?? '8000');

export const isProdEnvironment = process.env.ENVIRONMENT === 'production';

export const frontendDevOrigin = [/^http:\/\/localhost:\d+$/];

export const jwtSecret: string = process.env.JWT_SECRET;

export const refreshJwtSecret: string = process.env.REFRESH_JWT_SECRET;

export const jwtExpiresIn: string = process.env.JWT_SECRET_EXPIRES;

export const refreshTokenExpiresIn: string =
  process.env.REFRESH_JWT_SECRET_EXPIRES;

export const redisHost: string = process.env.REDIS_HOST;
export const redisPassword: string = process.env.REDIS_PASSWORD;
export const redisPort: number = parseInt(process.env.REDIS_PORT ?? '10359');