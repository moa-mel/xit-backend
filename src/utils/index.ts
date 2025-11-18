import { customAlphabet, urlAlphabet } from 'nanoid';
import { GenerateIdOptions } from './interfaces';
import { randomBytes } from 'crypto';

export * from './api-response-util';
export * from './interfaces';

export const generateId = (options: GenerateIdOptions): string => {
  const length = options.length ?? 15;
  const prefix = options.prefix ?? 'XIT';

  switch (options.type) {
    case 'identifier': {
      return customAlphabet(urlAlphabet, 16)();
    }
    case 'question': {
      return `${prefix}_Q${length}`;
    }
    case 'token': {
      return randomBytes(length).toString('hex');
    }

    default:
      break;
  }
};