'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FC,
  type TouchEvent,
  type MouseEvent,
} from 'react';

interface RemoteScreenShareOverlayProps {
  partnerName?: string;
  isRemoteCameraOn: boolean;
}

interface PipPosition {
  x: number;
  y: number;
}

interface PipSize {
  width: number;
  height: number;
}

type ViewMode = 'contain' | 'fit-width' | 'custom';

/**
 * Enhanced Overlay for remote screen sharing with:
 * - Draggable PiP window
 * - Resizable PiP
 * - Fullscreen mode
 * - Click to swap PiP/main
 * - Auto-hide controls
 * - Pinch-to-zoom on mobile
 * - Landscape orientation hint on mobile
 * - Fit Width mode for mobile-to-mobile viewing
 */
export const RemoteScreenShareOverlay: FC<RemoteScreenShareOverlayProps> = ({
  partnerName,
  isRemoteCameraOn,
}) => {
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenShareRef = useRef<HTMLDivElement>(null);

  // PiP position and size (draggable/resizable)
  const [pipPosition, setPipPosition] = useState<PipPosition>({ x: 0, y: 0 });
  const [pipSize, setPipSize] = useState<PipSize>({ width: 160, height: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; pipX: number; pipY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );

  // Swapped view state (PiP becomes main, main becomes PiP)
  const [isSwapped, setIsSwapped] = useState(false);

  // Auto-hide controls
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // View mode: contain (see all), fit-width (readable), or custom (pinch zoom)
  const [viewMode, setViewMode] = useState<ViewMode>('contain');

  // Zoom state for pinch-to-zoom and fit-width
  const [scale, setScale] = useState(1);
  const [translatePos, setTranslatePos] = useState({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  // For scrolling in fit-width mode
  const [scrollY, setScrollY] = useState(0);
  const lastTouchY = useRef<number | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showLandscapeHint, setShowLandscapeHint] = useState(false);

  // Detect mobile and orientation
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
      setIsMobile(mobile);

      // Show landscape hint on mobile portrait
      if (mobile && window.innerHeight > window.innerWidth) {
        setShowLandscapeHint(true);
        setTimeout(() => setShowLandscapeHint(false), 4000);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Calculate fit-width scale based on container and video dimensions
  const calculateFitWidthScale = useCallback(() => {
    if (!containerRef.current) return 1.5; // Default fallback

    // Assume shared screen is 16:9 aspect ratio (most common)
    // If portrait mobile share (9:16), fit-width would be ~1x
    // If landscape desktop share (16:9), fit-width fills width
    const assumedAspectRatio = 16 / 9;
    const containerAspectRatio =
      containerRef.current.clientWidth / containerRef.current.clientHeight;

    if (containerAspectRatio < assumedAspectRatio) {
      // Container is more portrait than content - scale up to fit width
      return assumedAspectRatio / containerAspectRatio;
    }
    return 1;
  }, []);

  // Auto-hide controls after inactivity
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      if (!isDragging && !isResizing) {
        setShowControls(false);
      }
    }, 3000);
  }, [isDragging, isResizing]);

  // Initialize hide timer on mount
  const hideTimerInitialized = useRef(false);
  useEffect(() => {
    if (!hideTimerInitialized.current) {
      hideTimerInitialized.current = true;
      // Use timeout to avoid synchronous setState
      const timerId = setTimeout(() => {
        resetHideTimer();
      }, 0);
      return () => clearTimeout(timerId);
    }
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [resetHideTimer]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported
    }
    resetHideTimer();
  }, [resetHideTimer]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle view mode: contain -> fit-width -> contain
  const cycleViewMode = useCallback(() => {
    setViewMode((current) => {
      if (current === 'contain') {
        const fitScale = calculateFitWidthScale();
        setScale(fitScale);
        setTranslatePos({ x: 0, y: 0 });
        setScrollY(0);
        return 'fit-width';
      } else {
        setScale(1);
        setTranslatePos({ x: 0, y: 0 });
        setScrollY(0);
        return 'contain';
      }
    });
    resetHideTimer();
  }, [calculateFitWidthScale, resetHideTimer]);

  // PiP Dragging handlers
  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        pipX: pipPosition.x,
        pipY: pipPosition.y,
      };
    },
    [pipPosition]
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !dragStartRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      // Calculate new position with bounds checking
      const newX = Math.max(
        -(containerRect.width - pipSize.width - 16),
        Math.min(0, dragStartRef.current.pipX + deltaX)
      );
      const newY = Math.max(
        -(containerRect.height - pipSize.height - 16),
        Math.min(0, dragStartRef.current.pipY + deltaY)
      );

      setPipPosition({ x: newX, y: newY });
    },
    [isDragging, pipSize]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    resetHideTimer();
  }, [resetHideTimer]);

  // PiP Resize handlers
  const handleResizeStart = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      resizeStartRef.current = {
        x: clientX,
        y: clientY,
        width: pipSize.width,
        height: pipSize.height,
      };
    },
    [pipSize]
  );

  const handleResizeMove = useCallback(
    (clientX: number, _clientY: number) => {
      if (!isResizing || !resizeStartRef.current) return;

      const deltaX = clientX - resizeStartRef.current.x;

      // Maintain aspect ratio (4:3)
      const newWidth = Math.max(120, Math.min(320, resizeStartRef.current.width - deltaX));
      const newHeight = newWidth * 0.75;

      setPipSize({ width: newWidth, height: newHeight });
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeStartRef.current = null;
    resetHideTimer();
  }, [resetHideTimer]);

  // Unified mouse/touch move handler
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging) handleDragMove(e.clientX, e.clientY);
      if (isResizing) handleResizeMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches.length === 1) {
        if (isDragging) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        if (isResizing) handleResizeMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (isDragging) handleDragEnd();
      if (isResizing) handleResizeEnd();
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing, handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

  // Pinch-to-zoom handlers
  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchDistance.current = distance;
        lastTouchCenter.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      } else if (e.touches.length === 1 && viewMode === 'fit-width') {
        // Single touch scroll in fit-width mode
        lastTouchY.current = e.touches[0].clientY;
      }
    },
    [viewMode]
  );

  const handlePinchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && lastTouchDistance.current) {
        // Pinch zoom
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const scaleChange = distance / lastTouchDistance.current;
        const newScale = Math.max(1, Math.min(4, scale * scaleChange));

        setScale(newScale);
        setViewMode('custom');
        lastTouchDistance.current = distance;

        // Pan with pinch
        if (lastTouchCenter.current) {
          const newCenter = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          };
          setTranslatePos((prev) => ({
            x: prev.x + (newCenter.x - lastTouchCenter.current!.x),
            y: prev.y + (newCenter.y - lastTouchCenter.current!.y),
          }));
          lastTouchCenter.current = newCenter;
        }
      } else if (
        e.touches.length === 1 &&
        viewMode === 'fit-width' &&
        lastTouchY.current !== null
      ) {
        // Vertical scroll in fit-width mode
        const deltaY = e.touches[0].clientY - lastTouchY.current;
        const containerHeight = containerRef.current?.clientHeight || 500;
        const contentHeight = containerHeight * scale;
        const maxScroll = Math.max(0, (contentHeight - containerHeight) / 2);

        setScrollY((prev) => Math.max(-maxScroll, Math.min(maxScroll, prev + deltaY)));
        lastTouchY.current = e.touches[0].clientY;
      }
      resetHideTimer();
    },
    [scale, viewMode, resetHideTimer]
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    lastTouchY.current = null;

    // Reset zoom if scale is close to 1
    if (scale < 1.1 && viewMode === 'custom') {
      setScale(1);
      setTranslatePos({ x: 0, y: 0 });
      setViewMode('contain');
    }
  }, [scale, viewMode]);

  // Double tap to toggle fit-width mode
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      cycleViewMode();
    }
    lastTapRef.current = now;
  }, [cycleViewMode]);

  // Swap PiP and main view
  const handleSwap = useCallback(() => {
    setIsSwapped((prev) => !prev);
    resetHideTimer();
  }, [resetHideTimer]);

  // Get transform style based on view mode
  const getTransformStyle = () => {
    if (viewMode === 'fit-width') {
      return {
        transform: `scale(${scale}) translateY(${scrollY / scale}px)`,
        transformOrigin: 'top center',
      };
    }
    return {
      transform: `scale(${scale}) translate(${translatePos.x / scale}px, ${translatePos.y / scale}px)`,
      transformOrigin: 'center center',
    };
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-30 rounded-lg overflow-hidden bg-slate-900 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      onClick={resetHideTimer}
      onMouseMove={resetHideTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handlePinchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main screen share view (or camera if swapped) */}
      <div
        ref={screenShareRef}
        id={isSwapped ? 'remote-video-pip' : 'remote-screen-share'}
        className="w-full h-full transition-transform duration-200"
        style={getTransformStyle()}
        onClick={handleDoubleTap}
      />

      {/* Landscape orientation hint for mobile */}
      {showLandscapeHint && isMobile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50 animate-fade-in">
          <div className="text-center text-white p-4">
            <svg
              className="w-16 h-16 mx-auto mb-3 animate-rotate-hint"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-medium">Rotate for better view</p>
            <p className="text-sm text-white/70 mt-1">Or double-tap to fit width</p>
          </div>
        </div>
      )}

      {/* Top status bar - auto-hides */}
      <div
        className={`absolute top-2 left-2 right-2 flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="text-white text-sm font-medium">
            {partnerName || 'Stranger'} is sharing
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-2">
          {/* View mode indicator */}
          <button
            onClick={cycleViewMode}
            className={`backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs transition-colors ${
              viewMode === 'fit-width' ? 'bg-blue-500/80' : 'bg-black/60 hover:bg-black/80'
            }`}
            title={viewMode === 'fit-width' ? 'Switch to Fit All' : 'Switch to Fit Width'}
          >
            {viewMode === 'fit-width'
              ? '↔ Fit Width'
              : viewMode === 'custom'
                ? `${Math.round(scale * 100)}%`
                : '⊡ Fit All'}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2 rounded-full text-white transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9L4 4m0 0v5m0-5h5m6 0l5-5m0 0v5m0-5h-5m-6 16l-5 5m0 0v-5m0 5h5m6 0l5 5m0 0v-5m0 5h-5"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Draggable/Resizable PiP for partner's camera (or screen share if swapped) */}
      {isRemoteCameraOn && (
        <div
          className={`absolute rounded-lg overflow-hidden border-2 border-white/70 shadow-xl cursor-move transition-shadow ${
            showControls ? 'opacity-100' : 'opacity-90'
          } ${isDragging ? 'shadow-2xl border-white' : ''}`}
          style={{
            bottom: 16 - pipPosition.y,
            right: 16 - pipPosition.x,
            width: pipSize.width,
            height: pipSize.height,
          }}
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget ||
              (e.target as HTMLElement).id ===
                (isSwapped ? 'remote-screen-share' : 'remote-video-pip')
            ) {
              handleDragStart(e.clientX, e.clientY);
            }
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onClick={handleSwap}
          title="Click to swap views"
        >
          <div
            id={isSwapped ? 'remote-screen-share' : 'remote-video-pip'}
            className="w-full h-full bg-slate-800"
          />

          {/* Swap indicator */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <svg
              className="w-6 h-6 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>

          {/* Resize handle */}
          <div
            className={`absolute top-0 left-0 w-4 h-4 cursor-nw-resize transition-opacity ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          >
            <div className="w-full h-full bg-white/30 hover:bg-white/50 rounded-br-lg flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M0 0h2v8H0V0zm3 3h2v5H3V3zm3 3h2v2H6V6z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Tap anywhere hint - shows once */}
      {showControls && isMobile && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/70 text-xs text-center">
          Double-tap: Fit Width • Pinch: Zoom • Scroll: Pan
        </div>
      )}
    </div>
  );
};

export default RemoteScreenShareOverlay;
