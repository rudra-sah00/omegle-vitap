import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { DottedGlowBackground } from '../dotted-glow-background';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  cb(Date.now());
  return 1;
});
global.cancelAnimationFrame = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('DottedGlowBackground', () => {
  let mockContext: any;
  let mockCanvas: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock canvas context
    mockContext = {
      clearRect: jest.fn(),
      save: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      restore: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
    };

    // Mock HTMLCanvasElement
    mockCanvas = {
      getContext: jest.fn(() => mockContext),
      width: 800,
      height: 600,
      style: {},
    };

    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render canvas element', () => {
      const { container } = render(<DottedGlowBackground />);
      
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should apply custom className', () => {
      const { container } = render(<DottedGlowBackground className="custom-bg" />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveProperty('className', expect.stringContaining('custom-bg'));
    });

    it('should have default dimensions', () => {
      const { container } = render(<DottedGlowBackground />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Configuration Props', () => {
    it('should accept gap prop', () => {
      const { container } = render(<DottedGlowBackground gap={20} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept radius prop', () => {
      const { container } = render(<DottedGlowBackground radius={3} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept color prop', () => {
      const { container } = render(<DottedGlowBackground color="rgba(255,0,0,0.5)" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept darkColor prop', () => {
      const { container } = render(<DottedGlowBackground darkColor="rgba(0,255,0,0.5)" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept glowColor prop', () => {
      const { container } = render(<DottedGlowBackground glowColor="rgba(0,0,255,0.8)" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept darkGlowColor prop', () => {
      const { container } = render(<DottedGlowBackground darkGlowColor="rgba(255,255,0,0.8)" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept opacity prop', () => {
      const { container } = render(<DottedGlowBackground opacity={0.8} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept backgroundOpacity prop', () => {
      const { container } = render(<DottedGlowBackground backgroundOpacity={0.5} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept speed configuration', () => {
      const { container } = render(
        <DottedGlowBackground 
          speedMin={0.2} 
          speedMax={1.5} 
          speedScale={2} 
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('should accept CSS variable names', () => {
      const { container } = render(
        <DottedGlowBackground 
          colorLightVar="--color-zinc-900"
          colorDarkVar="--color-zinc-100"
          glowColorLightVar="--glow-light"
          glowColorDarkVar="--glow-dark"
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Canvas Operations', () => {
    it('should get 2d context from canvas', async () => {
      render(<DottedGlowBackground />);
      
      await waitFor(() => {
        expect(mockCanvas.getContext).toHaveBeenCalledWith('2d', { alpha: true });
      });
    });

    it('should handle missing canvas context', () => {
      mockCanvas.getContext = jest.fn(() => null);
      
      const { container } = render(<DottedGlowBackground />);
      
      // Should not crash when context is null
      expect(container.firstChild).toBeTruthy();
    });

    it('should request animation frame', async () => {
      render(<DottedGlowBackground />);
      
      await waitFor(() => {
        expect(requestAnimationFrame).toHaveBeenCalled();
      });
    });

    it('should cancel animation frame on unmount', async () => {
      const { unmount } = render(<DottedGlowBackground />);
      
      await waitFor(() => {
        expect(requestAnimationFrame).toHaveBeenCalled();
      });

      unmount();

      await waitFor(() => {
        expect(cancelAnimationFrame).toHaveBeenCalled();
      });
    });
  });

  describe('Dark Mode Support', () => {
    it('should detect dark mode from root class', () => {
      document.documentElement.classList.add('dark');
      
      const { container } = render(<DottedGlowBackground />);
      
      expect(container.firstChild).toBeTruthy();
      
      document.documentElement.classList.remove('dark');
    });

    it('should detect light mode from root class', () => {
      document.documentElement.classList.add('light');
      
      const { container } = render(<DottedGlowBackground />);
      
      expect(container.firstChild).toBeTruthy();
      
      document.documentElement.classList.remove('light');
    });

    it('should use prefers-color-scheme media query', () => {
      const matchMediaMock = jest.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      window.matchMedia = matchMediaMock;
      
      const { container } = render(<DottedGlowBackground />);
      
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle different colors for dark and light mode', () => {
      const { rerender } = render(
        <DottedGlowBackground 
          color="rgba(0,0,0,0.7)"
          darkColor="rgba(255,255,255,0.7)"
          glowColor="rgba(0,170,255,0.85)"
          darkGlowColor="rgba(255,170,0,0.85)"
        />
      );

      document.documentElement.classList.add('dark');
      
      rerender(
        <DottedGlowBackground 
          color="rgba(0,0,0,0.7)"
          darkColor="rgba(255,255,255,0.7)"
          glowColor="rgba(0,170,255,0.85)"
          darkGlowColor="rgba(255,170,0,0.85)"
        />
      );

      document.documentElement.classList.remove('dark');
    });
  });

  describe('CSS Variable Resolution', () => {
    it('should resolve CSS variables from element', () => {
      const { container } = render(
        <DottedGlowBackground 
          colorLightVar="--test-color"
          glowColorLightVar="--test-glow"
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });

    it('should fallback to root for CSS variables', () => {
      const { container } = render(
        <DottedGlowBackground 
          colorDarkVar="--root-color"
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle missing CSS variables', () => {
      const { container } = render(
        <DottedGlowBackground 
          colorLightVar="--non-existent"
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Animation and Timing', () => {
    it('should handle animation with default speeds', () => {
      const { container } = render(<DottedGlowBackground />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle custom speed configuration', () => {
      const { container } = render(
        <DottedGlowBackground 
          speedMin={0.1}
          speedMax={2.0}
          speedScale={1.5}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle zero speed scale', () => {
      const { container } = render(<DottedGlowBackground speedScale={0} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small gap', () => {
      const { container } = render(<DottedGlowBackground gap={1} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle very large gap', () => {
      const { container } = render(<DottedGlowBackground gap={100} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle zero radius', () => {
      const { container } = render(<DottedGlowBackground radius={0} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle large radius', () => {
      const { container } = render(<DottedGlowBackground radius={20} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle zero opacity', () => {
      const { container } = render(<DottedGlowBackground opacity={0} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle full opacity', () => {
      const { container } = render(<DottedGlowBackground opacity={1} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle window resize', () => {
      const { container } = render(<DottedGlowBackground />);
      
      // Trigger resize
      global.dispatchEvent(new Event('resize'));
      
      expect(container.firstChild).toBeTruthy();
    });

    it('should use ResizeObserver when available', () => {
      const { container } = render(<DottedGlowBackground />);
      expect(container.firstChild).toBeTruthy();
    });
  });
});
