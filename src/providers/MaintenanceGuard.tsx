/**
 * Maintenance Guard Provider
 * Redirects users to maintenance page when maintenance mode is enabled
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
const ALLOWED_PATHS = ['/maintenance', '/terms', '/privacy', '/community-guidelines', '/faq'];

interface MaintenanceGuardProps {
  children: ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isAllowedPath = ALLOWED_PATHS.some((path) => pathname?.startsWith(path));

    if (MAINTENANCE_MODE && !isAllowedPath) {
      router.replace('/maintenance');
      return;
    }

    if (!MAINTENANCE_MODE && pathname === '/maintenance') {
      router.replace('/welcome');
      return;
    }
  }, [pathname, router]);

  if (MAINTENANCE_MODE && !ALLOWED_PATHS.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  return <>{children}</>;
}
