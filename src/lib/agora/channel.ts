/**
 * Agora Channel Join Logic with Retry
 */

import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import type { AgoraRTCConfig } from './types';
import { AGORA_CONFIG, isSlowNetwork } from './config';
import { createAndPublishTracks } from './tracks';

/**
 * Join Agora channel with retry logic
 */
export async function joinChannel(
  client: IAgoraRTCClient,
  config: AgoraRTCConfig,
  cameraOn: boolean,
  micOn: boolean,
  isLeaving: () => boolean,
  currentCameraId?: string,
  currentMicId?: string
): Promise<{
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
}> {
  // Validate config
  validateConfig(config);

  // Check network
  if (!navigator.onLine) {
    throw new Error('No internet connection');
  }

  const slowNetwork = isSlowNetwork();
  const maxRetries = AGORA_CONFIG.RETRY.MAX_JOIN_ATTEMPTS;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const baseTimeout = slowNetwork 
        ? AGORA_CONFIG.TIMEOUTS.JOIN.SLOW_NETWORK
        : AGORA_CONFIG.TIMEOUTS.JOIN.BASE;
      const timeoutDuration = baseTimeout + (attempt * AGORA_CONFIG.TIMEOUTS.JOIN.RETRY_INCREMENT);

      // Join with timeout
      await joinWithTimeout(client, config, timeoutDuration, attempt, maxRetries);

      // Create and publish tracks
      const tracks = await createAndPublishTracks(
        client,
        cameraOn,
        micOn,
        isLeaving,
        currentCameraId,
        currentMicId
      );

      return tracks;
    } catch (error) {
      lastError = error;
      
      if (isLeaving()) {
        throw error;
      }
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (shouldNotRetry(errorMsg)) {
        throw error;
      }
      
      // Clean up before retry
      try {
        await client.leave();
      } catch (leaveError) {
        // Ignore leave errors
      }
      
      // Wait before retry
      if (attempt < maxRetries - 1) {
        const retryDelay = AGORA_CONFIG.RETRY.BACKOFF_DELAYS[attempt];
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Failed to join channel after multiple attempts');
}

/**
 * Validate config before join
 */
function validateConfig(config: AgoraRTCConfig): void {
  if (!config.appId || !config.channelName) {
    throw new Error('Invalid Agora configuration: missing appId or channelName');
  }

  if (!config.uid) {
    throw new Error('Invalid Agora configuration: missing uid');
  }

  if (!config.token || config.token.trim().length === 0) {
    throw new Error('Invalid Agora token: Token is required to join channel');
  }
}

/**
 * Join with timeout
 */
async function joinWithTimeout(
  client: IAgoraRTCClient,
  config: AgoraRTCConfig,
  timeoutDuration: number,
  attempt: number,
  maxRetries: number
): Promise<void> {
  let timeoutId: NodeJS.Timeout | null = null;
  const joinTimeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const attemptMsg = attempt > 0 ? ` (Attempt ${attempt + 1}/${maxRetries})` : '';
      reject(new Error(`Connection timeout: Could not join channel${attemptMsg}. Please check your internet connection.`));
    }, timeoutDuration);
  });

  try {
    await Promise.race([
      client.join(
        config.appId,
        config.channelName,
        config.token,
        config.uid
      ),
      joinTimeout
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Check if error should not be retried
 */
function shouldNotRetry(errorMsg: string): boolean {
  return errorMsg.includes('token') || 
         errorMsg.includes('INVALID_') || 
         errorMsg.includes('permission') ||
         errorMsg.includes('DEVICE_NOT_FOUND');
}
