import { BULL_QUEUES } from "@/bull/constants";
import { PrismaService } from "@/modules/core/prisma/services";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import { CreatePodCastDto } from "../dtos";
import { User } from "@prisma/client";
import { NotificationQueue } from "../../notification/queues/interfaces";
import { NotificationJobType } from "../../notification/interfaces";
import { PodCastNotFoundException, UserAndSessionNotFoundException } from "../errors";

@Injectable()
export class PodCastService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(BULL_QUEUES.NOTIFICATION) private notificationQueue: Queue,
    ) { }

    async createPodcast(user: User, options: CreatePodCastDto) {
        const podcast = await this.prisma.podCast.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                title: options.title,
                description: options.description,
                picture: options.picture,
                audioUrl: options.audioUrl,
                date: options.date ?? new Date(),
                userId: user.id,
            }
        });

        await this.notificationQueue.add(NotificationQueue.NOTIFICATION_CREATE, {
            type: NotificationJobType.PODCAST,
            podCastId: podcast.id,
        });

        return buildResponse({
            message: 'Podcast created successfully',
            data: podcast,
        });
    }

    async getPodcastById(podcastId: number) {
        const podcast = await this.prisma.podCast.findUnique({
            where: { id: podcastId },
            include: {
                user: true,
                listener: true,
            }
        });

        if (!podcast) {
            throw new PodCastNotFoundException('Podcast not found', HttpStatus.NOT_FOUND);
        }

        return buildResponse({
            message: 'Podcast fetched successfully',
            data: podcast,
        });
    }

    async getPodcast(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [podcasts, total] = await Promise.all([
            this.prisma.podCast.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: true,
                    _count: {
                        select: { listener: true }
                    }
                }
            }),
            this.prisma.podCast.count(),
        ]);

        return buildResponse({
            message: 'Podcasts fetched successfully',
            data: {
                total,
                page,
                limit,
                podcasts,
            }
        });
    }


    async listenToPodcast(
        podcastId: number,
        userId?: number,
        sessionId?: string
    ) {
        if (!userId && !sessionId) {
            throw new UserAndSessionNotFoundException('User or sessionId is required', HttpStatus.NOT_FOUND);
        }

        const podcast = await this.prisma.podCast.findUnique({
            where: { id: podcastId }
        });

        if (!podcast) {
            throw new PodCastNotFoundException('Podcast not found', HttpStatus.NOT_FOUND);
        }

        await this.prisma.listener.upsert({
            where: userId
                ? { podcastId_userId: { podcastId, userId } }
                : { podcastId_sessionId: { podcastId, sessionId } },
            update: {},
            create: {
                identifier: generateId({ type: 'identifier' }),
                podcastId,
                userId,
                sessionId,
            }
        });

        return buildResponse({
            message: 'Listening recorded successfully',
        });
    }


}