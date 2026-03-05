import { HttpException } from '@nestjs/common';

export class AIDetectionNotFoundException extends HttpException {
  name = 'AIDetectionNotFoundException';
}

export class StreamNotFoundException extends HttpException {
  name = 'StreamNotFoundException';
}

export class InvalidContentTypeException extends HttpException {
  name = 'InvalidContentTypeException'
}

export class AIDetectionProcessingException extends HttpException {
  name = 'AIDetectionProcessingException'
}

export class InvalidContentUrlException extends HttpException {
  name = 'InvalidContentUrlException'
}
