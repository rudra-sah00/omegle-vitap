/**
 * DOM Element ID Constants
 * Centralized IDs for video elements and other DOM references
 *
 * @description Provides type-safe element IDs to avoid magic strings
 * throughout the codebase. Use these constants when referencing
 * video elements, screen share containers, or other DOM elements.
 *
 * @example
 * ```tsx
 * import { DOM_IDS } from '@/constants';
 *
 * const localVideo = document.getElementById(DOM_IDS.LOCAL_VIDEO);
 * ```
 */

export const DOM_IDS = {
  /** Local user's video element */
  LOCAL_VIDEO: 'local-video',

  /** Remote partner's video element */
  REMOTE_VIDEO: 'remote-video',

  /** Remote screen share display element */
  REMOTE_SCREEN_SHARE: 'remote-screen-share',

  /** Picture-in-picture element for remote camera during screen share */
  REMOTE_VIDEO_PIP: 'remote-video-pip',
} as const;

/** Type for DOM ID values */
export type DomId = (typeof DOM_IDS)[keyof typeof DOM_IDS];
