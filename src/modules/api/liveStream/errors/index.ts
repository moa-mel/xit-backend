import { HttpException } from "@nestjs/common";

export class ScheduleNotFoundException extends HttpException {
  name = 'ScheduleNotFoundException';
}

export class InvalidScheduleException extends HttpException {
  name = 'InvalidScheduleException';
}

export class StreamNotFoundException extends HttpException {
  name = 'StreamNotFoundException';
}