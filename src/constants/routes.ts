/**
 * Route Constants
 */

export const ROUTES = {
  HOME: '/',
  WELCOME: '/welcome',
  OMEGLE: '/omegle',
  MAINTENANCE: '/maintenance',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  FAQ: '/faq',
  COMMUNITY_GUIDELINES: '/community-guidelines',
} as const;

export const ALLOWED_MAINTENANCE_PATHS = [
  ROUTES.MAINTENANCE,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
  ROUTES.COMMUNITY_GUIDELINES,
  ROUTES.FAQ,
];
