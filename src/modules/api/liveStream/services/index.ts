import { PrismaService } from "@/modules/core/prisma/services";
import { CreateLiveStreamDto, EndLiveStreamDto, GetStreamStatsDto } from "../dtos";
import { NotificationType, User, AIDetectionStatus, AIDetectionResult, ContentType } from "@prisma/client";
import { buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import { StreamNotFoundException } from "../errors";
import { UserNotFoundException } from "../../auth/errors";
import { NotificationQueue } from "../../notification/queues/interfaces";
import { Queue } from "bull";
import { BULL_QUEUES } from "@/bull/constants";
import { InjectQueue } from "@nestjs/bull";
import { NotificationJobType } from "../../notification/interfaces";
import { AgoraService } from "@/core/agora/services";
import { AIDetectionService } from "../../aiDetection/services";

@Injectable()
export class LiveStreamService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(BULL_QUEUES.NOTIFICATION) private notificationQueue: Queue,
        private agoraService: AgoraService,
        private aiDetectionService: AIDetectionService
    ) { }

    async createLiveStream(user: User, options: CreateLiveStreamDto) {
        // Create Agora live stream
        const channelName = `stream-${generateId({ type: 'identifier' })}`;
        const hostUid = user.id; // Use user ID as Agora UID
        
        const agoraStream = await this.agoraService.createLiveStream({
            channelName,
            hostUid
        });

        const stream = await this.prisma.liveStream.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                title: options.title,
                isLive: true,
                startTime: new Date(),
                userId: user.id,
                agoraChannelName: channelName,
                agoraHostUid: hostUid,
                playbackUrl: agoraStream.streamUrl,
                streamKey: agoraStream.rtcToken,
            }
        })

        await this.notificationQueue.add(NotificationQueue.NOTIFICATION_CREATE, {
            type: NotificationJobType.LIVESTREAM,
            liveStreamId: stream.id,
        });

        return buildResponse({
            message: 'livestream started successfully',
            data: {
                ...stream,
                agoraConfig: agoraStream.clientConfig,
                appId: agoraStream.appId,
            },
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
                    title: dto.title || `${stream.title} (Recording)`,
                    videoUrl: dto.videoUrl,
                    isRecording: true,
                    userId: user.id,
                    duration,
                    sourceStream: {
                        connect: { id: stream.id }
                    }
                },
            });

            // Trigger AI detection if requested
            if (dto.triggerAIDetection && video) {
                await this.aiDetectionService.initiateDetection(user, {
                    contentType: ContentType.VIDEO,
                    contentUrl: dto.videoUrl,
                    contentTitle: video.title,
                    videoId: video.id,
                    liveStreamId: stream.id,
                });
            }
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

    async getStreamStats(liveStreamId: number, user: User) {
        const stream = await this.prisma.liveStream.findUnique({
            where: { id: liveStreamId },
            include: {
                liveStreamViewer: {
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
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                picture: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                recordedVideo: {
                    include: {
                        aiDetections: {
                            where: { userId: user.id },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                },
                aiDetections: {
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!stream) {
            throw new StreamNotFoundException('Stream not found', HttpStatus.NOT_FOUND);
        }

        // Check if user is the owner for detailed stats
        const isOwner = stream.userId === user.id;
        
        const viewerCount = stream.liveStreamViewer.length;
        const messageCount = stream.messages.length;
        const activeViewers = stream.liveStreamViewer.filter(v => v.user).length;
        const anonymousViewers = viewerCount - activeViewers;

        const stats = {
            streamId: stream.id,
            title: stream.title,
            isLive: stream.isLive,
            startTime: stream.startTime,
            endTime: stream.endTime,
            viewerCount,
            activeViewers,
            anonymousViewers,
            messageCount,
            duration: stream.startTime && stream.endTime 
                ? Math.floor((stream.endTime.getTime() - stream.startTime.getTime()) / 1000)
                : null,
            isOwner,
            ...(isOwner && {
                viewers: stream.liveStreamViewer,
                messages: stream.messages,
                recording: stream.recordedVideo,
                aiDetections: stream.aiDetections
            })
        };

        return buildResponse({
            message: 'Stream stats retrieved successfully',
            data: stats
        });
    }

    async sendMessage(user: User, dto: { content: string; liveStreamId: number }) {
        const stream = await this.prisma.liveStream.findUnique({
            where: { id: dto.liveStreamId }
        });

        if (!stream) {
            throw new StreamNotFoundException('Stream not found', HttpStatus.NOT_FOUND);
        }

        if (!stream.isLive) {
            throw new StreamNotFoundException('Stream is not live', HttpStatus.BAD_REQUEST);
        }

        const message = await this.prisma.message.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                content: dto.content,
                senderId: user.id,
                liveStreamId: dto.liveStreamId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        picture: true,
                    }
                }
            }
        });

        return buildResponse({
            message: 'Message sent successfully',
            data: message
        });
    }

    async getStreamMessages(liveStreamId: number, user?: User) {
        const stream = await this.prisma.liveStream.findUnique({
            where: { id: liveStreamId }
        });

        if (!stream) {
            throw new StreamNotFoundException('Stream not found', HttpStatus.NOT_FOUND);
        }

        const messages = await this.prisma.message.findMany({
            where: { liveStreamId },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        picture: true,
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return buildResponse({
            message: 'Messages retrieved successfully',
            data: messages
        });
    }

}