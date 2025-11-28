/**
 * LiveKit Service Exports
 */

// Main service facade
export { LiveKitService } from './livekit.facade';

// Configuration
export { LIVEKIT_CONFIG, getVideoSettingsForNetwork, getAudioSettingsForNetwork, isMobileDevice, isSafariBrowser, isSlowNetwork } from './config';
export type { NetworkQuality } from './config';

// Types
export type { LiveKitConfig, LiveKitCallbacks, DeviceIds, NetworkQualityLevel } from './types';

// Managers (for advanced usage)
export { TrackManager, ScreenShareManager, RoomManager } from './managers';
export * from './managers/video-renderer';
