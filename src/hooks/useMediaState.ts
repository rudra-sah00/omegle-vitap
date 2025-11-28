/**
 * useMediaState Hook
 * Access media state context
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
