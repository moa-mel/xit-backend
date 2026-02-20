import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Socket } from "socket.io";

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();

    if (!client.data.user) {
      throw new UnauthorizedException('Unauthorized socket');
    }

    return true;
  }
}