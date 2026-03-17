import { Injectable } from '@nestjs/common';
import { RtcTokenBuilder, RtmTokenBuilder } from 'agora-token';

export interface AgoraChannelConfig {
  channelName: string;
  uid?: number;
  role: 'publisher' | 'subscriber';
}

export interface AgoraLiveStreamConfig {
  channelName: string;
  hostUid: number;
}

@Injectable()
export class AgoraService {
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID;
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    if (!this.appId) {
      throw new Error('AGORA_APP_ID environment variable is required');
    }
  }

  /**
   * Generate RTC token for live streaming
   */
  generateRtcToken(config: AgoraChannelConfig, expirationTime: number = 3600): string {
    const { channelName, uid = 0, role } = config;
    
    if (!this.appCertificate) {
      throw new Error('AGORA_APP_CERTIFICATE environment variable is required for token generation');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationTimestamp = currentTimestamp + expirationTime;

    // Convert string role to numeric role expected by Agora
    const numericRole = role === 'publisher' ? 1 : 2;

    return RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      numericRole,
      expirationTimestamp,
      0
    );
  }

  /**
   * Generate RTM token for real-time messaging
   */
  generateRtmToken(uid: string, expirationTime: number = 3600): string {
    if (!this.appCertificate) {
      throw new Error('AGORA_APP_CERTIFICATE environment variable is required for token generation');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationTimestamp = currentTimestamp + expirationTime;

    return RtmTokenBuilder.buildToken(
      this.appId,
      this.appCertificate,
      uid,
      expirationTimestamp
    );
  }

  /**
   * Create a new live stream channel
   */
  async createLiveStream(config: AgoraLiveStreamConfig) {
    const { channelName, hostUid } = config;
    
    // Generate tokens for the host
    const rtcToken = this.generateRtcToken({
      channelName,
      uid: hostUid,
      role: 'publisher'
    });

    const rtmToken = this.generateRtmToken(hostUid.toString());

    return {
      appId: this.appId,
      channelName,
      hostUid,
      rtcToken,
      rtmToken,
      // Agora doesn't provide stream keys like MUX, but uses channel-based authentication
      streamUrl: `agora://${channelName}`,
      // For web clients, they'll use these tokens to join the channel
      clientConfig: {
        appId: this.appId,
        channel: channelName,
        token: rtcToken,
        uid: hostUid
      }
    };
  }

  /**
   * Generate audience token (subscriber role)
   */
  generateAudienceToken(channelName: string, uid: number = 0): string {
    return this.generateRtcToken({
      channelName,
      uid,
      role: 'subscriber'
    });
  }

  /**
   * Get Agora App ID (public info, can be shared with clients)
   */
  getAppId(): string {
    return this.appId;
  }
}
