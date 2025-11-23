/**
 * Agora Track Management - Create and Publish Tracks
 */

import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { AGORA_CONFIG, isMobileDevice } from './config';

/**
 * Create and publish tracks with retry logic
 */
export async function createAndPublishTracks(
  client: IAgoraRTCClient,
  cameraOn: boolean,
  micOn: boolean,
  isLeaving: () => boolean,
  currentCameraId?: string,
  currentMicId?: string
): Promise<{
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
}> {
  if (!client) {
    throw new Error('Client not initialized');
  }
  
  if (isLeaving()) {
    throw new Error('Cannot create tracks while leaving');
  }
  
  if (client.connectionState !== 'CONNECTED') {
    throw new Error('Not connected to channel');
  }

  const maxRetries = AGORA_CONFIG.RETRY.MAX_TRACK_ATTEMPTS;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await attemptCreateAndPublishTracks(
        client,
        cameraOn,
        micOn,
        isLeaving,
        currentCameraId,
        currentMicId
      );
    } catch (error) {
      lastError = error as Error;
      
      if (lastError.message.includes('DEVICE_NOT_FOUND') ||
          lastError.message.includes('PERMISSION_DENIED') ||
          lastError.message.includes('DEVICE_IN_USE')) {
        throw lastError;
      }

      if (isLeaving()) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = AGORA_CONFIG.RETRY.TRACK_BACKOFF_DELAYS[attempt];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to create tracks after multiple attempts');
}

/**
 * Single attempt to create and publish tracks
 */
async function attemptCreateAndPublishTracks(
  client: IAgoraRTCClient,
  cameraOn: boolean,
  micOn: boolean,
  isLeaving: () => boolean,
  currentCameraId?: string,
  currentMicId?: string
): Promise<{
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
}> {
  const timeoutDuration = isMobileDevice() 
    ? AGORA_CONFIG.TIMEOUTS.TRACK_CREATION.MOBILE
    : AGORA_CONFIG.TIMEOUTS.TRACK_CREATION.DESKTOP;

  let timeoutId: NodeJS.Timeout | null = null;
  const trackTimeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Track creation timeout: Could not access camera or microphone. This may be due to permission denial or device being in use.'));
    }, timeoutDuration);
  });

  try {
    // Check permission state (only if we need to create tracks)
    if (cameraOn || micOn) {
      await checkPermissions();
    }

    // Check available devices
    const devices = await AgoraRTC.getDevices().catch(() => []);
    const hasMicrophone = devices.some(d => d.kind === 'audioinput');
    const hasCamera = devices.some(d => d.kind === 'videoinput');

    // Only throw error if user wants devices but none exist
    if ((cameraOn && !hasCamera) && (micOn && !hasMicrophone)) {
      if (timeoutId) clearTimeout(timeoutId);
      throw new Error('DEVICE_NOT_FOUND: No camera or microphone found. Please connect a device and grant permissions.');
    }

    // Create tracks ONLY if user wants them ON
    let videoTrack: ICameraVideoTrack | null = null;
    let audioTrack: IMicrophoneAudioTrack | null = null;

    // Create both tracks if both are available and wanted
    if (cameraOn && micOn && hasMicrophone && hasCamera) {
      const result = await createBothTracks(trackTimeout, currentCameraId, currentMicId);
      audioTrack = result.audioTrack;
      videoTrack = result.videoTrack;
    } else {
      // Create individual tracks only if wanted and available
      if (micOn && hasMicrophone) {
        audioTrack = await createAudioTrack(trackTimeout, currentMicId);
      }
      if (cameraOn && hasCamera) {
        videoTrack = await createVideoTrack(trackTimeout, currentCameraId);
      }
    }

    if (timeoutId) clearTimeout(timeoutId);

    // Publish tracks that were created
    const tracksToPublish = [];
    if (videoTrack) tracksToPublish.push(videoTrack);
    if (audioTrack) tracksToPublish.push(audioTrack);

    if (tracksToPublish.length > 0) {
      await publishTracks(client, tracksToPublish);
    }

    return { videoTrack, audioTrack };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Check permissions before creating tracks
 * NOTE: This function does NOT actively request permissions.
 * It only checks if permissions are explicitly denied.
 * Actual permission prompts will happen when Agora tries to create tracks.
 */
async function checkPermissions(): Promise<void> {
  // Use Permissions API when available to detect explicit denial early
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => null);
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => null);

      // Only throw error if BOTH are explicitly denied (not just one)
      // Allow joining if at least one device has permission
      if (cameraPermission?.state === 'denied' && micPermission?.state === 'denied') {
        throw new Error('PERMISSION_DENIED: Camera and microphone access denied. Please allow access in your browser settings.');
      }
    }
  } catch (error) {
    // If permissions API fails, continue anyway - let Agora handle it
    if ((error as Error).message?.includes('PERMISSION_DENIED')) {
      throw error;
    }
  }

  // DO NOT actively request getUserMedia here
  // Let Agora SDK handle permission requests only when user turns on camera/mic
  return;
}

/**
 * Create both audio and video tracks
 */
async function createBothTracks(
  trackTimeout: Promise<never>,
  currentCameraId?: string,
  currentMicId?: string
): Promise<{ audioTrack: IMicrophoneAudioTrack; videoTrack: ICameraVideoTrack }> {
  const tracksPromise = AgoraRTC.createMicrophoneAndCameraTracks(
    {
      ...AGORA_CONFIG.AUDIO,
      microphoneId: currentMicId || undefined,
    },
    {
      encoderConfig: AGORA_CONFIG.VIDEO,
      optimizationMode: AGORA_CONFIG.VIDEO_OPTIMIZATION_MODE,
      cameraId: currentCameraId || undefined,
    }
  );

  try {
    const [audioTrack, videoTrack] = await Promise.race([
      tracksPromise,
      trackTimeout
    ]) as [IMicrophoneAudioTrack, ICameraVideoTrack];
    
    return { audioTrack, videoTrack };
  } catch (error) {
    throw parseTrackCreationError(error);
  }
}

/**
 * Create audio track only
 */
async function createAudioTrack(
  trackTimeout: Promise<never>,
  currentMicId?: string
): Promise<IMicrophoneAudioTrack> {
  try {
    return await Promise.race([
      AgoraRTC.createMicrophoneAudioTrack({
        ...AGORA_CONFIG.AUDIO,
        microphoneId: currentMicId || undefined,
      }),
      trackTimeout
    ]) as IMicrophoneAudioTrack;
  } catch (error) {
    throw parseTrackCreationError(error, 'microphone');
  }
}

/**
 * Create video track only
 */
async function createVideoTrack(
  trackTimeout: Promise<never>,
  currentCameraId?: string
): Promise<ICameraVideoTrack> {
  try {
    return await Promise.race([
      AgoraRTC.createCameraVideoTrack({
        encoderConfig: AGORA_CONFIG.VIDEO,
        optimizationMode: AGORA_CONFIG.VIDEO_OPTIMIZATION_MODE,
        cameraId: currentCameraId || undefined,
      }),
      trackTimeout
    ]) as ICameraVideoTrack;
  } catch (error) {
    throw parseTrackCreationError(error, 'camera');
  }
}

/**
 * Publish tracks to channel
 */
async function publishTracks(
  client: IAgoraRTCClient,
  tracks: Array<ICameraVideoTrack | IMicrophoneAudioTrack>
): Promise<void> {
  let publishTimeoutId: NodeJS.Timeout | null = null;
  const publishTimeout = new Promise<never>((_, reject) => {
    publishTimeoutId = setTimeout(() => {
      reject(new Error('Publish timeout: Could not publish tracks to channel'));
    }, AGORA_CONFIG.TIMEOUTS.PUBLISH);
  });

  try {
    await Promise.race([
      client.publish(tracks),
      publishTimeout
    ]);
  } finally {
    if (publishTimeoutId) clearTimeout(publishTimeoutId);
  }
}

/**
 * Parse track creation errors
 */
function parseTrackCreationError(error: unknown, deviceType?: 'camera' | 'microphone'): Error {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errorLower = errorMsg.toLowerCase();
  
  if (errorLower.includes('permission') || errorLower.includes('notallowed')) {
    const device = deviceType ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1) : 'Camera or microphone';
    return new Error(`PERMISSION_DENIED: ${device} access was denied. Please allow access in your browser settings.`);
  }
  
  if (errorLower.includes('notfound') || errorLower.includes('not found')) {
    const device = deviceType ? deviceType : 'camera or microphone';
    return new Error(`DEVICE_NOT_FOUND: ${device.charAt(0).toUpperCase() + device.slice(1)} not found. Please check if device is connected.`);
  }
  
  if (errorLower.includes('notreadable') || errorLower.includes('in use')) {
    const device = deviceType ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1) : 'Camera or microphone';
    return new Error(`DEVICE_IN_USE: ${device} is being used by another application. Please close other apps.`);
  }
  
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Cleanup tracks
 */
export function cleanupTracks(
  videoTrack: ICameraVideoTrack | null,
  audioTrack: IMicrophoneAudioTrack | null
): void {
  if (videoTrack) {
    videoTrack.stop();
    videoTrack.close();
  }
  if (audioTrack) {
    audioTrack.stop();
    audioTrack.close();
  }
}
