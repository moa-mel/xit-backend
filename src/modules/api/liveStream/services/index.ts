import { PrismaService } from "@/modules/core/prisma/services";


export class LiveStreamService {
    constructor(
        private prisma: PrismaService,
    ) { }

}