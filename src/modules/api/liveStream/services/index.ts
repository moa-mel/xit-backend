import { PrismaService } from "@/modules/core/prisma/services";
import { CreateLiveStreamDto, EndLiveStreamDto } from "../dtos";
import { NotificationType, User } from "@prisma/client";
import { buildResponse, generateId } from "@/utils";
import { HttpStatus } from "@nestjs/common";
import { StreamNotFoundException } from "../errors";
import { UserNotFoundException } from "../../auth/errors";
import { NotificationQueue } from "../../notification/queues/interfaces";
import { Queue } from "bull";
import { BULL_QUEUES } from "@/bull/constants";
import { InjectQueue } from "@nestjs/bull";
import { NotificationJobType } from "../../notification/interfaces";


export class LiveStreamService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(BULL_QUEUES.NOTIFICATION) private notificationQueue: Queue,
    ) { }

    async createLiveStream(user: User, options: CreateLiveStreamDto) {


        const stream = await this.prisma.liveStream.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                title: options.title,
                isLive: true, // Go live immediately 
                startTime: new Date(),
                userId: user.id,
            }
        })

        await this.notificationQueue.add(NotificationQueue.NOTIFICATION_CREATE, {
            type: NotificationJobType.LIVESTREAM,
            liveStreamId: stream.id,
        });


        return buildResponse({
            message: 'livestream started successfully',
            data: stream,
        });

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
                    sourceStream: {
                        connect: { id: stream.id }
                    }
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

    async joinLiveStream(liveStreamId: number,
        user?: User,
        sessionId?: string) {
        const stream = await this.prisma.liveStream.findUnique({
            where: { id: liveStreamId },
        });

        if (!stream) {
            throw new StreamNotFoundException('Stream not found', HttpStatus.NOT_FOUND);
        }

        if (!stream.isLive) {
            throw new StreamNotFoundException('Stream is not live', HttpStatus.BAD_REQUEST);
        }

        await this.prisma.liveStreamViewer.upsert({
            where: user
                ? { liveStreamId_userId: { liveStreamId, userId: user.id } }
                : { liveStreamId_sessionId: { liveStreamId, sessionId } },
            update: {},
            create: {
                identifier: generateId({ type: 'identifier' }),
                liveStreamId,
                userId: user?.id,
                sessionId,
            },
        });

        return buildResponse({
            message: 'Joined live stream successfully',
            data: {
                liveStreamId,
                playbackUrl: stream.playbackUrl,
            },
        });

    }

}