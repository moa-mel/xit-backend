import { PrismaService } from "@/modules/core/prisma/services";
import { CreateLiveStreamDto, EndLiveStreamDto } from "../dtos";
import { NotificationType, User } from "@prisma/client";
import { buildResponse, generateId } from "@/utils";
import { HttpStatus } from "@nestjs/common";
import { InvalidScheduleException, ScheduleNotFoundException, StreamNotFoundException } from "../errors";
import { UserNotFoundException } from "../../auth/errors";
import { NotificationQueue } from "../../notification/queues/interfaces";
import { Queue } from "bull";
import { BULL_QUEUES } from "@/bull/constants";
import { InjectQueue } from "@nestjs/bull";


export class LiveStreamService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(BULL_QUEUES.NOTIFICATION) private notificationQueue: Queue,
    ) { }

    async createLiveStream(user: User, options: CreateLiveStreamDto) {
        if (options.isScheduled && !options.scheduledFor) {
            throw new ScheduleNotFoundException('scheduledFor is required for scheduled streams', HttpStatus.BAD_REQUEST)
        }

        if (options.isScheduled) {
            const scheduledDate = new Date(options.scheduledFor);
            if (scheduledDate <= new Date()) {
                throw new InvalidScheduleException('scheduledFor must be in the future', HttpStatus.BAD_REQUEST);
            }
        }

        const stream = await this.prisma.liveStream.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                title: options.title,
                streamUrl: options.streamUrl,
                isScheduled: options.isScheduled || false,
                scheduledFor: options.scheduledFor ? new Date(options.scheduledFor) : null,
                isLive: options.isScheduled ? false : true, // Go live immediately if not scheduled
                startTime: options.isScheduled ? null : new Date(),
                userId: user.id,
            }
        })

        await this.notificationQueue.add(NotificationQueue.NOTIFICATION_CREATE, {
            identifier: generateId({ type: 'identifier' }),
            title: 'Live Stream Started',
            description: `A live stream just started`,
            type: NotificationType.LIVESTREAM,
            userId: user.id,
            liveStreamId: stream.id,
        });

        return buildResponse({
            message: 'livestream created successfully',
            data: stream,
        });

    }

    // For scheduled streams, call this when user clicks "Go Live"
    async startScheduledStream(liveStreamId: number) {
        const stream = await this.prisma.liveStream.findUnique({
            where: {
                id: liveStreamId
            }
        })

        if (!stream.isScheduled) {
            throw new StreamNotFoundException('This stream was not scheduled', HttpStatus.BAD_REQUEST);
        }

        if (stream.isLive) {
            throw new StreamNotFoundException('Stream is already live', HttpStatus.BAD_REQUEST);
        }

        const updateStream = await this.prisma.liveStream.update({
            where: {
                id: liveStreamId
            },
            data: {
                isLive: true,
                startTime: new Date()
            }
        })

        return buildResponse({
            message: 'Scheduled Stream started successfully',
            data: updateStream
        })

    }

    async endLiveStream(user: User, liveStreamId: number, dto: EndLiveStreamDto) {
        // Find the stream and verify ownership
        const stream = await this.prisma.liveStream.findUnique({
            where: { id: liveStreamId }
        });

        if (!stream) {
            throw new StreamNotFoundException('Stream not found', HttpStatus.NOT_FOUND);
        }

        // Verify user owns the stream
        if (stream.userId !== user.id) {
            throw new UserNotFoundException('You do not own this stream', HttpStatus.NOT_FOUND);
        }

        if (!stream.isLive) {
            throw new StreamNotFoundException('Stream is not live', HttpStatus.BAD_REQUEST);
        }

        // Create recorded video if URL is provided
        let video = null;
        if (dto.videoUrl) {
            // Calculate duration from stream's startTime to now
            const duration = stream.startTime
                ? Math.floor((new Date().getTime() - stream.startTime.getTime()) / 1000)
                : null;

            video = await this.prisma.video.create({
                data: {
                    identifier: generateId({ type: 'identifier' }),
                    title: dto.title || `${stream.title} (Recording)`, // Use custom title or default
                    videoUrl: dto.videoUrl,
                    isRecording: true,
                    userId: user.id,
                    duration,
                },
            });
        }

        // Update stream to ended
        const updatedStream = await this.prisma.liveStream.update({
            where: { id: liveStreamId },
            data: {
                isLive: false,
                endTime: new Date(),
                recordedVideoId: video?.id,
            },
            include: {
                recordedVideo: true,
            },
        });

        return buildResponse({
            message: 'Live stream ended successfully',
            data: updatedStream
        });
    }

    // Get upcoming scheduled streams
    async getScheduledStreams(userId: number) {
        const scheduledStreams = await this.prisma.liveStream.findMany({
            where: {
                userId,
                isScheduled: true,
                isLive: false,
                scheduledFor: {
                    gte: new Date(), // Future streams only
                },
            },
            orderBy: {
                scheduledFor: 'asc',
            },
        });

        return buildResponse({
            message: 'Scheduled Stream started successfully',
            data: scheduledStreams
        })

    }

    // Get currently live streams
    async getLiveStreams() {
        const currentLiveStreams = await this.prisma.liveStream.findMany({
            where: {
                isLive: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        picture: true,
                    },
                },
            },
            orderBy: {
                startTime: 'desc',
            },
        });

        return buildResponse({
            message: 'Scheduled Stream started successfully',
            data: currentLiveStreams
        })

    }

}