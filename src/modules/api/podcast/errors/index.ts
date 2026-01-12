import { HttpException } from "@nestjs/common";

export class PodCastNotFoundException extends HttpException {
  name = 'PodCastNotFoundException';
}

export class UserAndSessionNotFoundException extends HttpException {
  name = 'UserAndSessionNotFoundException';
}