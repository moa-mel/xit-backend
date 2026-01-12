import { HttpException } from "@nestjs/common";

export class StreamNotFoundException extends HttpException {
  name = 'StreamNotFoundException';
}