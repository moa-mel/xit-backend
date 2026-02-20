import { Controller, Post, Get, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ChatService } from "../services";
import { JoinChatDto, JoinLivestreamChatDto, SendMessageDto } from "../dtos";
import { AuthGuard } from "../../auth/guards";

@Controller({
  path: 'chat',
})
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) { }
  
  @Post('start')
  async startChat(@Req() req: any, @Body() dto: JoinChatDto) {
    return this.chatService.startChat(req.user, dto);
  }

  @Post('join-livestream')
  async joinLivestreamChat(@Req() req: any, @Body() dto: JoinLivestreamChatDto) {
    return this.chatService.joinLivestreamChat(req.user, dto.liveStreamId);
  }

  @Post('send-message')
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user, dto);
  }

  @Get('messages/:userId')
  async fetchMessages(@Req() req: any, @Param('userId') userId: string) {
    return this.chatService.fetchMessages(req.user, userId);
  }

  @Get('livestream-comments/:liveStreamId')
  async fetchLivestreamComments(@Req() req: any, @Param('liveStreamId') liveStreamId: string) {
    return this.chatService.fetchLivestreamComments(req.user, parseInt(liveStreamId));
  }

  @Get('conversations')
  async fetchUsersInConversations(@Req() req: any) {
    return this.chatService.fetchUsersInConversations(req.user);
  }
}