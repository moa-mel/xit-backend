import { BULL_QUEUES } from "@/bull/constants";
import { PrismaService } from "@/modules/core/prisma/services";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import { CreatePodCastDto, PaginationDto, GetPodcastStatsDto } from "../dtos";
import { Prisma, User, ContentType } from "@prisma/client";
import { NotificationQueue } from "../../notification/queues/interfaces";
import { NotificationJobType } from "../../notification/interfaces";
import { PodCastNotFoundException, UserAndSessionNotFoundException } from "../errors";
import { AIDetectionService } from "../../aiDetection/services";

@Injectable()
export class PodCastService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(BULL_QUEUES.NOTIFICATION) private notificationQueue: Queue,
        private aiDetectionService: AIDetectionService
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

        // Trigger AI detection if requested
        if (options.triggerAIDetection) {
            await this.aiDetectionService.initiateDetection(user, {
                contentType: ContentType.PODCAST,
                contentUrl: options.audioUrl,
                contentTitle: options.title,
                podcastId: podcast.id,
            });
        }

        await this.notificationQueue.add(NotificationQueue.NOTIFICATION_CREATE, {
            type: NotificationJobType.PODCAST,
            podCastId: podcast.id,
        });

        return buildResponse({
            message: 'Podcast created successfully',
            data: podcast,
        });
    }

     async getPodcast(options: PaginationDto) {
        const meta: Partial<PaginationMeta> = {};

        // Base query (no pagination yet)
        const queryOptions: Prisma.PodCastFindManyArgs = {
            orderBy: { createdAt: 'asc' },
        };

        // pagination comes as STRING from query: "true" | "false"
        const isPaginated = options.pagination === 'true';

        if (isPaginated) {
            const page = Number(options.page) || 1;
            const limit = Number(options.limit) || 10;
            const skip = (page - 1) * limit;

            queryOptions.skip = skip;
            queryOptions.take = limit;

            const totalCount = await this.prisma.podCast.count();

            meta.totalCount = totalCount;
            meta.page = page;
            meta.perPage = limit;
        }

        const podCasts = await this.prisma.podCast.findMany(queryOptions);

        const result = {
            meta: meta,
            records: podCasts
        };

        return buildResponse({
            message: 'Podcasts fetched successfully',
            data: {
                result
            },
        });
    }

    async getPodcastById(podcastId: number, user?: User) {
        const podcast = await this.prisma.podCast.findUnique({
            where: { id: podcastId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        picture: true,
                    }
                },
                listener: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                picture: true,
                            }
                        }
                    }
                },
                aiDetections: user ? {
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' }
                } : false
            }
        });

        if (!podcast) {
            throw new PodCastNotFoundException('Podcast not found', HttpStatus.NOT_FOUND);
        }

        // Check if user is the owner for detailed stats
        const isOwner = user ? podcast.userId === user.id : false;
        
        const listenerCount = podcast.listener.length;
        const activeListeners = podcast.listener.filter(l => l.user).length;
        const anonymousListeners = listenerCount - activeListeners;

        const response = {
            ...podcast,
            listenerCount,
            activeListeners,
            anonymousListeners,
            isOwner,
        };

        // Only include detailed data for owners
        if (isOwner) {
            (response as any).listeners = podcast.listener;
            (response as any).aiDetections = podcast.aiDetections;
        }

        return buildResponse({
            message: 'Podcast fetched successfully',
            data: response,
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

    async getPodcastStats(podcastId: number, user: User) {
        const podcast = await this.prisma.podCast.findUnique({
            where: { id: podcastId },
            include: {
                listener: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                picture: true,
                            }
                        }
                    }
                },
                aiDetections: {
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!podcast) {
            throw new PodCastNotFoundException('Podcast not found', HttpStatus.NOT_FOUND);
        }

        // Check if user is the owner
        const isOwner = podcast.userId === user.id;
        
        if (!isOwner) {
            throw new PodCastNotFoundException('You do not have access to these stats', HttpStatus.FORBIDDEN);
        }

        const listenerCount = podcast.listener.length;
        const activeListeners = podcast.listener.filter(l => l.user).length;
        const anonymousListeners = listenerCount - activeListeners;
        
        // Calculate listening trends
        const dailyListeners = this.groupListenersByDate(podcast.listener);
        const topListeners = podcast.listener
            .filter(l => l.user)
            .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
            .slice(0, 10);

        const stats = {
            podcastId: podcast.id,
            title: podcast.title,
            totalListeners: listenerCount,
            activeListeners,
            anonymousListeners,
            duration: podcast.duration,
            createdAt: podcast.createdAt,
            dailyListeners,
            topListeners,
            aiDetections: podcast.aiDetections,
        };

        return buildResponse({
            message: 'Podcast stats retrieved successfully',
            data: stats
        });
    }

    private groupListenersByDate(listeners: any[]) {
        return listeners.reduce((acc, listener) => {
            const date = new Date(listener.joinedAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
    }

}