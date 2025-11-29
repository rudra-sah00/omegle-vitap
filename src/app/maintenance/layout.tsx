/**
 * Maintenance Page Layout
 *
 * @description Provides metadata for the maintenance page.
 * Using static metadata export instead of document.title manipulation
 * for proper SEO and browser tab display.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Under Maintenance - Omegle',
  description: 'Omegle is currently undergoing scheduled maintenance. Service will resume shortly.',
  robots: {
    index: false,
    follow: false,
  },
};

interface MaintenanceLayoutProps {
  children: React.ReactNode;
}

export default function MaintenanceLayout({ children }: MaintenanceLayoutProps) {
  return children;
}
