/**
 * Agora Preview Mode - Create local tracks before joining
 */

import AgoraRTC, {
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { AGORA_CONFIG } from './config';

/**
 * Create local preview without joining channel
 */
export async function createLocalPreview(
  cameraOn: boolean,
  micOn: boolean,
  localVideoTrack: ICameraVideoTrack | null,
  localAudioTrack: IMicrophoneAudioTrack | null,
  isJoined: boolean
): Promise<{
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
}> {
  // Validate browser support
  const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  const hasWebkitGetUserMedia = (navigator as any).webkitGetUserMedia;
  
  if (!hasMediaDevices && !hasWebkitGetUserMedia) {
    throw new Error('Browser does not support media devices');
  }

  // Prevent preview if already in a call
  if (isJoined) {
    return { videoTrack: localVideoTrack, audioTrack: localAudioTrack };
  }

  // If tracks already exist, update state
  if (localVideoTrack && localAudioTrack) {
    try {
      await localVideoTrack.setEnabled(cameraOn);
      await localAudioTrack.setEnabled(micOn);
      
      if (cameraOn) {
        localVideoTrack.play('local-video');
      }
      return { videoTrack: localVideoTrack, audioTrack: localAudioTrack };
    } catch (error) {
      // Clean up and recreate
      localVideoTrack?.close();
      localAudioTrack?.close();
    }
  }

  // Check available devices
  const devices = await navigator.mediaDevices.enumerateDevices();
  const hasCamera = devices.some(d => d.kind === 'videoinput');
  const hasMic = devices.some(d => d.kind === 'audioinput');

  if (cameraOn && !hasCamera) {
    throw new Error('No camera device found');
  }
  if (micOn && !hasMic) {
    throw new Error('No microphone device found');
  }

  // Create tracks
  const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
    AGORA_CONFIG.AUDIO,
    {
      encoderConfig: AGORA_CONFIG.VIDEO,
      optimizationMode: AGORA_CONFIG.VIDEO_OPTIMIZATION_MODE,
    }
  );

  // Set initial state
  await videoTrack.setEnabled(cameraOn);
  await audioTrack.setEnabled(micOn);
  
  // Play preview
  if (cameraOn && videoTrack) {
    videoTrack.play('local-video');
  }

  return { videoTrack, audioTrack };
}

/**
 * Stop preview and cleanup tracks
 */
export function stopPreview(
  localVideoTrack: ICameraVideoTrack | null,
  localAudioTrack: IMicrophoneAudioTrack | null,
  isJoined: boolean
): void {
  if (isJoined) {
    return;
  }

  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack.close();
  }

  if (localAudioTrack) {
    localAudioTrack.stop();
    localAudioTrack.close();
  }
}
