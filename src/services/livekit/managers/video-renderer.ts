/**
 * Video Renderer
 * Utility functions for attaching video tracks to DOM elements
 */

import type { LocalVideoTrack, RemoteParticipant } from 'livekit-client';
import { Track as TrackConstants } from 'livekit-client';

// Track type that can be attached to DOM
type AttachableTrack = { attach: (element: HTMLMediaElement) => HTMLMediaElement };

/**
 * Create a video element with standard styling
 */
function createVideoElement(
  objectFit: 'cover' | 'contain' = 'cover',
  muted: boolean = false
): HTMLVideoElement {
  const videoEl = document.createElement('video');
  videoEl.style.width = '100%';
  videoEl.style.height = '100%';
  videoEl.style.objectFit = objectFit;
  videoEl.muted = muted;
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  return videoEl;
}

/**
 * Attach a video track to a DOM element
 *
 * Handles both direct video elements and container divs.
 * For containers, creates a video element with proper styling.
 */
export function attachTrackToElement(
  track: AttachableTrack,
  elementId: string,
  options: { objectFit?: 'cover' | 'contain'; muted?: boolean } = {}
): void {
  const { objectFit = 'cover', muted = false } = options;

  const element = document.getElementById(elementId);
  if (!element) return;

  if (element instanceof HTMLVideoElement) {
    track.attach(element);
  } else {
    const videoEl = createVideoElement(objectFit, muted);
    element.innerHTML = '';
    element.appendChild(videoEl);
    track.attach(videoEl);
  }
}

/**
 * Attach local video track to element
 * Detaches first to prevent multiple attachments
 */
export function attachLocalVideo(track: LocalVideoTrack | null, elementId: string): void {
  if (!track) return;

  // Detach from any previous elements
  track.detach();

  attachTrackToElement(track, elementId, { muted: true });
}

/**
 * Attach remote participant's camera video
 */
export function attachRemoteVideo(participant: RemoteParticipant, elementId: string): void {
  const videoTrack = participant
    .getTrackPublications()
    .find(
      (pub) =>
        pub.track?.kind === TrackConstants.Kind.Video && pub.source === TrackConstants.Source.Camera
    )?.track;

  if (videoTrack) {
    attachTrackToElement(videoTrack, elementId, { objectFit: 'cover' });
  }
}

/**
 * Attach remote participant's camera to PiP element
 * Used to show camera in small window
 */
export function attachRemoteCameraToPip(participant: RemoteParticipant, elementId: string): void {
  const cameraTrack = participant
    .getTrackPublications()
    .find(
      (pub) =>
        pub.source === TrackConstants.Source.Camera && pub.track?.kind === TrackConstants.Kind.Video
    )?.track;

  if (cameraTrack) {
    attachTrackToElement(cameraTrack, elementId, { objectFit: 'cover' });
  }
}
