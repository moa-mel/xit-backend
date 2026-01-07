import { PrismaService } from "@/modules/core/prisma/services";
import { buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { CreateNotificationDto, FetchNotificationsDto } from "../dtos";
import { Prisma } from "@prisma/client";
import { StreamNotFoundException } from "../../liveStream/errors";
import { PodCastNotFoundException } from "../../podcast/errors";
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
    constructor(
        private prisma: PrismaService
    ) { }

    async createLiveStreamNotification(liveStreamId: number, userId: number) {
        const liveStream = await this.prisma.liveStream.findUnique({
            where: { id: liveStreamId },
            include: { user: true },
        });

        if (!liveStream) {
            Logger.warn(
                `Invalid liveStreamId (${liveStreamId}) - skipping notification creation`,
            );
            return;
        }

        return this.prisma.notification.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                title: 'Live Stream Started',
                description: `${liveStream.user.firstName} ${liveStream.user.lastName} is now live: ${liveStream.title}`,
                type: NotificationType.LIVESTREAM,
                userId: userId,
                liveStreamId: liveStream.id,
            },
        });
    }

    // Create notification for podcast
    async createPodcastNotification(podcastId: number, userId: number) {
        const podcast = await this.prisma.podCast.findUnique({
            where: { id: podcastId },
            include: { user: true },
        });

        if (!podcast) {
            Logger.warn(
                `Invalid podcastId (${podcastId}) - skipping notification creation`,
            );
            return;
        }

        return this.prisma.notification.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                title: 'New Podcast Episode',
                description: `${podcast.user.firstName} ${podcast.user.lastName} uploaded: ${podcast.title}`,
                type: NotificationType.PODCAST,
                userId: userId,
                podcastId: podcast.id,
            },
        });
    }

    // Notify all users about live stream
    async notifyUsersAboutLiveStream(liveStreamId: number) {
        const liveStream = await this.prisma.liveStream.findUnique({
            where: { id: liveStreamId },
            include: {
                user: {
                    select: { id: true },
                },
            },
        });

        if (!liveStream) {
            throw new StreamNotFoundException(
                'Live stream not found',
                HttpStatus.NOT_FOUND,
            );
        }

        // Get all users of the stream creator
        // Assuming you have a users system
        const users = await this.prisma.user.findMany({
            where: {
                id: {
                    not: liveStream.userId,
                },
            },
            select: {
                id: true,
            },
        });

        // Create notifications for all users
        const notifications = await Promise.all(
            users.map((user) =>
                this.createLiveStreamNotification(liveStreamId, user.id),
            ),
        );

        Logger.log(
            `Created ${notifications.length} notifications for live stream ${liveStreamId}`,
        );

        return notifications;
    }

    // Notify all Users about podcast
    async notifyUsersAboutPodcast(podcastId: number) {
        const podcast = await this.prisma.podCast.findUnique({
            where: { id: podcastId },
            include: {
                user: {
                    select: { id: true },
                },
            },
        });

        if (!podcast) {
            throw new PodCastNotFoundException(
                'Podcast not found',
                HttpStatus.NOT_FOUND,
            );
        }

        const users = await this.prisma.user.findMany({
            where: {
                id: {
                    not: podcast.userId
                }
            },
            select: {
                id: true,
            },
        });

        const notifications = await Promise.all(
            users.map((user) =>
                this.createPodcastNotification(podcastId, user.id),
            ),
        );

        Logger.log(
            `Created ${notifications.length} notifications for podcast ${podcastId}`,
        );

        return notifications;
    }

    // Fetch notifications with filters
    async fetchNotifications(userId: number, options: FetchNotificationsDto) {
        const queryOptions: Prisma.NotificationFindManyArgs = {
            where: {
                userId,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                liveStream: {
                    select: {
                        id: true,
                        identifier: true,
                        title: true,
                        isLive: true,
                        startTime: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                picture: true,
                            },
                        },
                    },
                },
                podcast: {
                    select: {
                        id: true,
                        identifier: true,
                        title: true,
                        thumbnailUrl: true,
                        duration: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                picture: true,
                            },
                        },
                    },
                },
            },
        };

        // Filter by type
        if (options.type) {
            queryOptions.where.type = options.type;
        }

        // Filter by read status
        if (options.isRead !== undefined) {
            queryOptions.where.isRead = options.isRead;
        }

        const notifications = await this.prisma.notification.findMany(queryOptions);

        // Get unread count
        const unreadCount = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return buildResponse({
            message: 'Notifications fetched successfully',
            data: {
                notifications,
                unreadCount,
            },
        });
    }

}