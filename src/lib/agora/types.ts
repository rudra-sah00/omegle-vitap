/**
 * Type definitions for Agora RTC Service
 */

import type { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

export interface AgoraRTCConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: string;
}

export interface AgoraCallbacks {
  onUserPublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  onUserUnpublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onUserLeft?: (user: IAgoraRTCRemoteUser) => void;
}

export interface DeviceIds {
  cameraId?: string;
  micId?: string;
}
