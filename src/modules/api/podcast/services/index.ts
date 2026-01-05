import { PrismaService } from "@/modules/core/prisma/services";

export class PodCastService {
    constructor(
        private prisma: PrismaService,
    ) { }

}