import { IsEnum, IsNumber, IsString } from 'class-validator';
import { MessageType } from '@prisma/client';


export class JoinChatDto {
  @IsNumber()
  userId: number;
}

export class JoinLivestreamChatDto {
  @IsNumber()
  liveStreamId: number;
}


export class SendMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  content: string;

   @IsEnum(MessageType)
  type: MessageType;
}