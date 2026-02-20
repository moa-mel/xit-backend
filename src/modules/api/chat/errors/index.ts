import { HttpException } from "@nestjs/common";


export class JoinChatError extends HttpException {
    name = 'JoinChatError'
}

export class InvalidConversationIdException extends HttpException {
    name = 'InvalidConversationIdException'
}