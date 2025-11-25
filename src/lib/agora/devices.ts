/**
 * Agora Device Management - Camera and Microphone Toggle/Switch
 */

import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { AGORA_CONFIG } from './config';

/**
 * Toggle camera on/off
 */
export async function toggleCamera(
  client: IAgoraRTCClient | null,
  localVideoTrack: ICameraVideoTrack | null,
  enabled: boolean,
  isJoined: boolean,
  isLeaving: boolean,
  currentCameraId?: string
): Promise<ICameraVideoTrack | null> {
  if (isLeaving) {
    return localVideoTrack;
  }
  
  if (enabled) {
    // Turn ON
    if (!localVideoTrack) {
      // Check if camera is available
      const devices = await AgoraRTC.getDevices();
      const hasCamera = devices.some(d => d.kind === 'videoinput');
      
      if (!hasCamera) {
        throw new Error('DEVICE_NOT_FOUND: No camera found. Please connect a camera and try again.');
      }

      // Create track with timeout
      const createTimeout = setTimeout(() => {
        throw new Error('Camera timeout: Could not access camera');
      }, AGORA_CONFIG.TIMEOUTS.TRACK_TOGGLE);

      // Only specify cameraId if explicitly set, otherwise Agora auto-selects default
      const newTrack = await AgoraRTC.createCameraVideoTrack(
        currentCameraId ? { cameraId: currentCameraId } : {}
      );

      clearTimeout(createTimeout);
      
      // Play video
      newTrack.play('local-video');
      
      // Publish if in call and connection is stable
      if (isJoined && client && client.connectionState === 'CONNECTED') {
        const publishTimeout = setTimeout(() => {
          throw new Error('Publish timeout: Could not publish camera');
        }, 5000);

        try {
          await client.publish([newTrack]);
          clearTimeout(publishTimeout);
        } catch (error: any) {
          clearTimeout(publishTimeout);
          // If publish fails due to disconnection, just keep track locally
          if (error?.code === 'INVALID_OPERATION' || client.connectionState !== 'CONNECTED') {
            console.warn('Cannot publish - connection not stable, keeping track locally');
          } else {
            throw error;
          }
        }
      }
      
      return newTrack;
    } else {
      // Track exists, re-enable it
      await localVideoTrack.setEnabled(true);
      
      // Always re-play video to ensure it displays
      // Stop first to reset any stale state, then play again
      try {
        localVideoTrack.stop();
      } catch (e) {
        // Ignore stop errors
      }
      
      // Play video locally - this ensures fresh rendering
      localVideoTrack.play('local-video');
      
      // Only publish if in call, connected, and not already published
      if (isJoined && client && client.connectionState === 'CONNECTED') {
        // Check if already published to avoid double publish
        const publishedTracks = client.localTracks;
        if (!publishedTracks.includes(localVideoTrack)) {
          try {
            await client.publish([localVideoTrack]);
          } catch (error: any) {
            // If publish fails due to disconnection, just keep track locally
            if (error?.code !== 'INVALID_OPERATION' && client.connectionState === 'CONNECTED') {
              throw error;
            }
          }
        }
      }
      
      return localVideoTrack;
    }
  } else {
    // Turn OFF
    if (localVideoTrack) {
      // Disable track first to stop sending
      await localVideoTrack.setEnabled(false);
      
      // Unpublish if in call
      if (isJoined && client) {
        try {
          await client.unpublish([localVideoTrack]);
        } catch (unpublishError) {
          // Ignore unpublish errors
        }
      }
      
      // Stop and close track
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    return null;
  }
}

/**
 * Toggle microphone on/off
 */
export async function toggleMicrophone(
  client: IAgoraRTCClient | null,
  localAudioTrack: IMicrophoneAudioTrack | null,
  enabled: boolean,
  isJoined: boolean,
  isLeaving: boolean,
  currentMicId?: string
): Promise<IMicrophoneAudioTrack | null> {
  if (isLeaving) {
    return localAudioTrack;
  }
  
  if (enabled) {
    // Turn ON
    if (!localAudioTrack) {
      // Check if microphone is available
      const devices = await AgoraRTC.getDevices();
      const hasMicrophone = devices.some(d => d.kind === 'audioinput');
      
      if (!hasMicrophone) {
        throw new Error('DEVICE_NOT_FOUND: No microphone found. Please connect a microphone and try again.');
      }

      // Create track with timeout
      const createTimeout = setTimeout(() => {
        throw new Error('Microphone timeout: Could not access microphone');
      }, AGORA_CONFIG.TIMEOUTS.TRACK_TOGGLE);

      // Only specify microphoneId if explicitly set, otherwise Agora auto-selects default
      const newTrack = await AgoraRTC.createMicrophoneAudioTrack(
        currentMicId ? { microphoneId: currentMicId } : {}
      );

      clearTimeout(createTimeout);
      
      // Publish if in call and connection is stable
      if (isJoined && client && client.connectionState === 'CONNECTED') {
        const publishTimeout = setTimeout(() => {
          throw new Error('Publish timeout: Could not publish microphone');
        }, 5000);

        try {
          await client.publish([newTrack]);
          clearTimeout(publishTimeout);
        } catch (error: any) {
          clearTimeout(publishTimeout);
          // If publish fails due to disconnection, just keep track locally
          if (error?.code === 'INVALID_OPERATION' || client.connectionState !== 'CONNECTED') {
            console.warn('Cannot publish - connection not stable, keeping track locally');
          } else {
            throw error;
          }
        }
      }
      
      return newTrack;
    } else {
      // Track exists, re-enable it
      await localAudioTrack.setEnabled(true);
      
      // Only publish if in call, connected, and not already published
      if (isJoined && client && client.connectionState === 'CONNECTED') {
        // Check if already published to avoid double publish
        const publishedTracks = client.localTracks;
        if (!publishedTracks.includes(localAudioTrack)) {
          try {
            await client.publish([localAudioTrack]);
          } catch (error: any) {
            // If publish fails due to disconnection, just keep track locally
            if (error?.code !== 'INVALID_OPERATION' && client.connectionState === 'CONNECTED') {
              throw error;
            }
          }
        }
      }
      
      return localAudioTrack;
    }
  } else {
    // Turn OFF
    if (localAudioTrack) {
      // Disable track first to stop sending audio
      await localAudioTrack.setEnabled(false);
      
      // Unpublish if in call
      if (isJoined && client) {
        try {
          await client.unpublish([localAudioTrack]);
        } catch (unpublishError) {
          // Ignore unpublish errors
        }
      }
      
      // Stop and close track
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    return null;
  }
}

/**
 * Switch camera device
 */
export async function switchCamera(
  client: IAgoraRTCClient | null,
  localVideoTrack: ICameraVideoTrack | null,
  deviceId: string,
  isJoined: boolean,
  isLeaving: boolean
): Promise<ICameraVideoTrack | null> {
  if (isLeaving) {
    return localVideoTrack;
  }
  
  const wasEnabled = !!localVideoTrack;
  
  if (wasEnabled && localVideoTrack) {
    // Unpublish old track first if in call
    if (isJoined && client) {
      try {
        await client.unpublish([localVideoTrack]);
      } catch (err) {
        // Ignore unpublish errors
      }
    }
    
    // Stop and close old track
    localVideoTrack.stop();
    localVideoTrack.close();
    
    // Create new track with new device
    const newTrack = await AgoraRTC.createCameraVideoTrack({
      cameraId: deviceId,
    });
    
    // Play
    newTrack.play('local-video');
    
    // Publish if in call
    if (isJoined && client) {
      await client.publish([newTrack]);
    }
    
    return newTrack;
  }
  
  return localVideoTrack;
}

/**
 * Switch microphone device
 */
export async function switchMicrophone(
  client: IAgoraRTCClient | null,
  localAudioTrack: IMicrophoneAudioTrack | null,
  deviceId: string,
  isJoined: boolean,
  isLeaving: boolean
): Promise<IMicrophoneAudioTrack | null> {
  if (isLeaving) {
    return localAudioTrack;
  }
  
  const wasEnabled = !!localAudioTrack;
  
  if (wasEnabled && localAudioTrack) {
    // Close old track
    if (isJoined && client) {
      await client.unpublish([localAudioTrack]);
    }
    localAudioTrack.stop();
    localAudioTrack.close();
    
    // Create new track
    const newTrack = await AgoraRTC.createMicrophoneAudioTrack({
      microphoneId: deviceId,
    });
    
    // Publish if in call
    if (isJoined && client) {
      await client.publish([newTrack]);
    }
    
    return newTrack;
  }
  
  return localAudioTrack;
}
