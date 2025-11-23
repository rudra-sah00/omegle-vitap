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

    if (MAINTENANCE_MODE && !isAllowedPath) {
      router.replace('/maintenance');
    } else if (!MAINTENANCE_MODE && pathname === '/maintenance') {
      router.replace('/welcome');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
