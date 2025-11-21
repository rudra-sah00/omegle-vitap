import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE;
  const isMaintenanceMode = maintenanceMode === 'true';
  
  // Allow access to these pages even in maintenance mode
  const allowedPaths = ['/maintenance', '/terms', '/privacy', '/community-guidelines'];
  const isAllowedPath = allowedPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  // If in maintenance mode and not on an allowed page
  if (isMaintenanceMode && !isAllowedPath) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
  
  // If not in maintenance mode but trying to access maintenance page
  if (!isMaintenanceMode && request.nextUrl.pathname.startsWith('/maintenance')) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
