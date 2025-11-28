/**
 * useMediaState Hook
 * Access camera and microphone state
 * 
 * @description Provides access to the current state of camera and microphone,
 * along with functions to toggle them. This hook must be used within a
 * MediaStateProvider component.
 * 
 * The media state is:
 * - Persisted in session storage across navigations
 * - Shared across all components using this hook
 * - Synchronized with the actual device states
 * 
 * @returns {MediaStateContextType} Media state context with:
 *   - isCameraOn: boolean - Current camera state
 *   - isMicOn: boolean - Current microphone state
 *   - setCameraOn: (on: boolean) => void - Update camera state
 *   - setMicOn: (on: boolean) => void - Update microphone state
 * 
 * @throws {Error} If used outside of MediaStateProvider
 * 
 * @example
 * ```tsx
 * function MediaControls() {
 *   const { isCameraOn, isMicOn, setCameraOn, setMicOn } = useMediaState();
 *   
 *   return (
 *     <div>
 *       <button onClick={() => setCameraOn(!isCameraOn)}>
 *         {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
 *       </button>
 *       <button onClick={() => setMicOn(!isMicOn)}>
 *         {isMicOn ? 'Mute' : 'Unmute'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useContext } from 'react';
import { MediaStateContext, type MediaStateContextType } from '@/providers/MediaStateProvider';

export function useMediaState(): MediaStateContextType {
  const context = useContext(MediaStateContext);
  if (context === undefined) {
    throw new Error('useMediaState must be used within a MediaStateProvider');
  }
  return context;
}
