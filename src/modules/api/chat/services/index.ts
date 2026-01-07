import { BULL_QUEUES } from "@/bull/constants";
import { PrismaService } from "@/modules/core/prisma/services";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";


export class ChatService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(BULL_QUEUES.NOTIFICATION) private notificationQueue: Queue,
    ) { }

}