import { BULL_QUEUES } from "@/bull/constants";
import { PrismaService } from "@/modules/core/prisma/services";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { JoinChatDto, SendMessageDto } from "../dtos";
import { User, ChatType } from "@prisma/client";
import { InvalidConversationIdException, JoinChatError } from "../errors";
import { HttpStatus } from "@nestjs/common";
import { buildResponse } from "@/utils";
import { UserNotFoundException } from "../../auth/errors";


export class ChatService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(BULL_QUEUES.NOTIFICATION) private notificationQueue: Queue,
    ) { }

      async startChat(user: User, options: JoinChatDto) {
    if (user.id === options.userId) {
      throw new JoinChatError(
        'User cannot chat with self',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.DM,
        participants: { every: { userId: { in: [user.id, options.userId] } } },
      },
      include: { participants: true },
    });

    if (existingChat)
      return buildResponse({
        message: 'Chat started successfully',
        data: existingChat,
      });

    const newChat = await this.prisma.chat.create({
      data: {
        identifier: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: ChatType.DM,
        participants: {
          create: [{ userId: user.id }, { userId: options.userId }],
        },
      },
      include: { participants: true },
    });

    return buildResponse({
      message: 'Chat started successfully',
      data: {
        conversationId: newChat.id,
        participants: newChat.participants.map((p) => p.userId),
      },
    });
  }

  async joinLivestreamChat(user: User, liveStreamId: number) {
    const liveStream = await this.prisma.liveStream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      throw new InvalidConversationIdException(
        'Live stream not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    let livestreamChat = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.LIVESTREAM,
        liveStreamId: liveStreamId,
      },
    });

    if (!livestreamChat) {
      livestreamChat = await this.prisma.chat.create({
        data: {
          identifier: `livestream-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: ChatType.LIVESTREAM,
          liveStreamId: liveStreamId,
        },
      });
    }

    const existingParticipant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId: livestreamChat.id,
        userId: user.id,
      },
    });

    if (!existingParticipant) {
      await this.prisma.chatParticipant.create({
        data: {
          chatId: livestreamChat.id,
          userId: user.id,
        },
      });
    }

    return buildResponse({
      message: 'Joined livestream chat successfully',
      data: {
        conversationId: livestreamChat.id,
        liveStreamId: liveStreamId,
      },
    });
  }

  async isParticipant(
    conversationId: number,
    userId: number,
  ): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId: conversationId,
        userId,
      },
    });

    return !!participant;
  }

  async sendMessage(user: User, options: SendMessageDto) {
    const conversation = await this.prisma.chat.findUnique({
      where: {
        id: parseInt(options.conversationId),
      },
    });

    if (!conversation) {
      throw new InvalidConversationIdException(
        'Conversation id is invalid.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let message;

    if (conversation.type === ChatType.LIVESTREAM && conversation.liveStreamId) {
      message = await this.prisma.message.create({
        data: {
          identifier: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: { connect: { id: user.id } },
          content: options.content,
          liveStream: { connect: { id: conversation.liveStreamId } },
        },
      });
    } else {
      message = await this.prisma.message.create({
        data: {
          identifier: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          chat: { connect: { id: conversation.id } },
          sender: { connect: { id: user.id } },
          content: options.content,
        },
      });
    }

    return buildResponse({
      message: 'Message sent successfully.',
      data: message,
    });
  }

  async fetchMessages(user: User, userId: string) {
    const participant = await this.prisma.user.findUnique({
      where: {
        identifier: userId,
      },
    });

    if (!participant) {
      throw new UserNotFoundException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const conversation = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.DM,
        participants: { every: { userId: { in: [user.id, participant.id] } } },
      },
    });

    if (!conversation) {
      return buildResponse({
        message: 'No messages found.',
      });
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId: conversation.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return buildResponse({
      message: 'Messages fetched successfully.',
      data: messages,
    });
  }

  async fetchLivestreamComments(user: User, liveStreamId: number) {
    const liveStream = await this.prisma.liveStream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      throw new InvalidConversationIdException(
        'Live stream not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    const comments = await this.prisma.message.findMany({
      where: {
        liveStreamId: liveStreamId,
      },
      include: {
        sender: {
          select: {
            id: true,
            identifier: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return buildResponse({
      message: 'Livestream comments fetched successfully.',
      data: comments,
    });
  }

  async fetchUsersInConversations(user: User) {
    const conversations = await this.prisma.chatParticipant.findMany({
      where: {
        userId: user.id,
      },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    identifier: true,
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return buildResponse({
      message: 'Users fetched successfully.',
      data: conversations.map((c) => {
        const otherParticipants = c.chat.participants
          .filter((p) => p.userId !== user.id)
          .map((p) => p.user);

        return {
          conversationId: c.chat.id,
          users: otherParticipants,
        };
      }),
    });
  }

}