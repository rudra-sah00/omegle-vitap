/**
 * Agora RTC Event Handlers
 */

import type { IAgoraRTCClient, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import type { AgoraCallbacks } from './types';

/**
 * Setup event listeners for Agora client
 */
export function setupAgoraEventListeners(
  client: IAgoraRTCClient,
  callbacks: AgoraCallbacks
): void {
  client.on('user-published', async (user, mediaType) => {
    try {
      if (mediaType === 'audio' || mediaType === 'video') {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          // Video track available
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }

        callbacks.onUserPublished?.(user, mediaType);
      }
    } catch (error) {
      // Silently handle subscription errors
    }
  });

  client.on('user-unpublished', (user, mediaType) => {
    try {
      if (mediaType === 'audio' || mediaType === 'video') {
        callbacks.onUserUnpublished?.(user, mediaType);
      }
    } catch (error) {
      // Silently handle unsubscription errors
    }
  });

  client.on('user-joined', (user) => {
    try {
      callbacks.onUserJoined?.(user);
    } catch (error) {
      // Silently handle user join errors
    }
  });

  client.on('user-left', (user) => {
    try {
      callbacks.onUserLeft?.(user);
    } catch (error) {
      // Silently handle user leave errors
    }
  });

  client.on('connection-state-change', (curState, prevState, reason) => {
    // Silently monitor connection state
  });

  client.on('exception', (event) => {
    // Silently handle Agora exceptions
  });
}
