import { HttpException } from "@nestjs/common";

export class PodCastNotFoundException extends HttpException {
  name = 'PodCastNotFoundException';
}