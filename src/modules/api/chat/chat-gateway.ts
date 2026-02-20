import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { WsAuthGuard } from "./guards";
import { ChatService } from "./services";
import { PrismaService } from "@/modules/core/prisma/services";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from 'socket.io';
import logger from 'moment-logger';
import { DataStoredInToken } from "../auth/interfaces";
import { jwtSecret } from "@/config";
import { MessageType } from "@prisma/client";
import { JoinLivestreamChatDto } from "./dtos";

interface RoomInfo {
  roomId: string;
  clients: Set<string>;
  createdAt: Date;
  lastActivity: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(WsAuthGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @WebSocketServer() server: Server;

  private rooms: Map<string, RoomInfo> = new Map();

  afterInit(server: Server) {
    logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    logger.log('New user connected!', client.id);

    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload: DataStoredInToken = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtSecret,
        },
      );

      const user = await this.prisma.user.findUnique({
        where: { identifier: payload.sub },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;

      client.broadcast.emit('user-joined', {
        message: `New user joined the chat: ${client.id}`,
      });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    logger.log('User disconnected.', client.id);
    this.server.emit('user-left', {
      message: `User left the chat: ${client.id}`,
    });
    client.removeAllListeners();
    client.disconnect(true);
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    this.server.emit('broadcast', {
      message: `Broadcast to all: ${data?.message || ''}`,
      timestamp: new Date().toISOString(),
      fromClient: client.id,
    });
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): string {
    logger.log(`Recieved message from ${client.id}: ${JSON.stringify(data)}`);

    let originalMessage;
    if (data && typeof data === 'string') {
      originalMessage = JSON.parse(data)?.message;
    }
    if (data && typeof data === 'object') {
      originalMessage = data?.message;
    }

    this.server.to(client.id).emit('message', {
      originalMessage,
      timestamp: new Date().toISOString(),
    });

    return 'Message recieved!';
  }

  @SubscribeMessage('joinLivestreamChat')
  async handleJoinLivestreamChat(
    @MessageBody() data: JoinLivestreamChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    
    try {
      const result = await this.chatService.joinLivestreamChat(user, data.liveStreamId);
      const roomId = `livestream-${data.liveStreamId}`;
      
      client.join(roomId);
      
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          roomId,
          clients: new Set(),
          createdAt: new Date(),
          lastActivity: new Date(),
        });
      }
      
      const room = this.rooms.get(roomId);
      if (room) {
        room.clients.add(client.id);
        room.lastActivity = new Date();
      }
      
      client.emit('joinedLivestreamChat', {
        success: true,
        conversationId: result.data.conversationId,
        liveStreamId: data.liveStreamId,
        roomId,
      });
      
      logger.log(`User ${user.email} joined livestream chat ${data.liveStreamId}`);
    } catch (error) {
      client.emit('error', {
        message: error.message || 'Failed to join livestream chat',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody()
    data: { roomId: string; username?: string } = { roomId: 'room1' },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, username } = data;

    client.join(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        clients: new Set(),
        createdAt: new Date(),
        lastActivity: new Date(),
      });
    }

    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.add(client.id);
      room.lastActivity = new Date();
    }

    client.emit('joinRoom', {
      roomId,
      clientId: client.id,
      clientInRooms: room?.clients?.size,
    });

    logger.log(`Client ${client.id} joined room ${roomId}`);
    return {
      roomId,
      clientId: client.id,
      username: username || `User-${client.id.slice(0, 6)}`,
      clientsInRoom: room?.clients?.size,
    };
  }

  @SubscribeMessage('roomMessage')
  async handleRoomMessage(
    @MessageBody()
    data: { conversationId: string; message: string; type:  MessageType },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = client.data.user;

    const { conversationId, message, type } = data;

    const room = this.rooms.get(conversationId);
    if (!room?.clients.has(client.id) || !client.rooms.has(conversationId)) {
      this.server
        .to(client.id)
        .emit('roomMessage', { error: 'You are not a member of this room!' });
      return;
    }

    if (room) {
      room.lastActivity = new Date();
    }

    const result = await this.chatService.sendMessage(user, {
      conversationId: conversationId,
      content: data.message,
      type: data.type || 'TEXT',
    });

    this.server.to(conversationId).emit('roomMessage', {
      conversationId,
      message: result.data.content,
      from: { id: user.id, email: user.email },
      timestamp: result.data.createdAt,
      type: data.type || 'TEXT',
    });

    logger.log(
      `Room message in ${conversationId} from user ${user.id}: ${message}`,
    );
  }

  @SubscribeMessage('listRooms')
  handleListRooms(@ConnectedSocket() client: Socket) {
    const roomList = Array.from(this.rooms.entries()).map(([roomId, room]) => ({
      roomId,
      clientCount: this.rooms.size,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
    }));

    return roomList;
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, roomId: string): void {
    if (client.rooms.has(roomId)) {
      client.leave(roomId);
    }

    const room = this.rooms.get(roomId);

    if (room) {
      room.clients.delete(client.id);

      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
      } else {
        room.lastActivity = new Date();
      }
    }

    client.emit('leaveRoom', { roomId });
    logger.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('typing')
  handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const { conversationId } = data;

    if (!client.rooms.has(conversationId)) return;

    client.to(conversationId).emit('typing', {
      conversationId,
      userId: user.id,
    });
  }
}