'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
const ALLOWED_PATHS = ['/maintenance', '/terms', '/privacy', '/community-guidelines', '/faq'];

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isAllowedPath = ALLOWED_PATHS.some(path => pathname?.startsWith(path));

    // If maintenance mode is ON, redirect all non-allowed paths to maintenance page
    if (MAINTENANCE_MODE && !isAllowedPath) {
      router.replace('/maintenance');
      return;
    }
    
    // If maintenance mode is OFF, prevent access to maintenance page
    if (!MAINTENANCE_MODE && pathname === '/maintenance') {
      router.replace('/welcome');
      return;
    }
  }, [pathname, router]);

  // If maintenance mode is ON and user is on a non-allowed path, don't render content
  // to prevent flashing of protected content
  if (MAINTENANCE_MODE && !ALLOWED_PATHS.some(path => pathname?.startsWith(path))) {
    return null;
  }

  return <>{children}</>;
}
