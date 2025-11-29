import { describe, it, expect } from 'vitest';
import { ROUTES, ALLOWED_MAINTENANCE_PATHS } from '@/constants/routes';

describe('Route Constants', () => {
  describe('ROUTES', () => {
    it('should have HOME route', () => {
      expect(ROUTES.HOME).toBe('/');
    });

    it('should have WELCOME route', () => {
      expect(ROUTES.WELCOME).toBe('/welcome');
    });

    it('should have OMEGLE route', () => {
      expect(ROUTES.OMEGLE).toBe('/omegle');
    });

    it('should have MAINTENANCE route', () => {
      expect(ROUTES.MAINTENANCE).toBe('/maintenance');
    });

    it('should have TERMS route', () => {
      expect(ROUTES.TERMS).toBe('/terms');
    });

    it('should have PRIVACY route', () => {
      expect(ROUTES.PRIVACY).toBe('/privacy');
    });

    it('should have FAQ route', () => {
      expect(ROUTES.FAQ).toBe('/faq');
    });

    it('should have COMMUNITY_GUIDELINES route', () => {
      expect(ROUTES.COMMUNITY_GUIDELINES).toBe('/community-guidelines');
    });

    it('all routes should start with /', () => {
      Object.values(ROUTES).forEach((route) => {
        expect(route.startsWith('/')).toBe(true);
      });
    });
  });

  describe('ALLOWED_MAINTENANCE_PATHS', () => {
    it('should include MAINTENANCE route', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).toContain(ROUTES.MAINTENANCE);
    });

    it('should include TERMS route', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).toContain(ROUTES.TERMS);
    });

    it('should include PRIVACY route', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).toContain(ROUTES.PRIVACY);
    });

    it('should include COMMUNITY_GUIDELINES route', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).toContain(ROUTES.COMMUNITY_GUIDELINES);
    });

    it('should include FAQ route', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).toContain(ROUTES.FAQ);
    });

    it('should NOT include HOME route', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).not.toContain(ROUTES.HOME);
    });

    it('should NOT include OMEGLE route', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).not.toContain(ROUTES.OMEGLE);
    });

    it('should have exactly 5 allowed paths during maintenance', () => {
      expect(ALLOWED_MAINTENANCE_PATHS).toHaveLength(5);
    });
  });
});
