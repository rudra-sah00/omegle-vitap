/**
 * Services - Central Export
 * All external service integrations
 */

// Socket.IO Service
export { SocketIOService, getSocketIOService, destroySocketIOService } from './socket';
export type {
  MessageHandler,
  ErrorHandler,
  CloseHandler,
  OpenHandler,
  ISocketService,
} from './socket';

// LiveKit Service
export {
  LiveKitService,
  LIVEKIT_CONFIG,
  getVideoSettingsForNetwork,
  getAudioSettingsForNetwork,
  isMobileDevice,
  isSafariBrowser,
  isSlowNetwork,
} from './livekit';
export type {
  LiveKitConfig,
  LiveKitCallbacks,
  DeviceIds,
  NetworkQualityLevel,
  NetworkQuality,
} from './livekit';

// Firebase Service
export {
  initializeFirebase,
  getFirebaseApp,
  getFirebaseAnalytics,
  analytics,
  AnalyticsEvents,
} from './firebase';
