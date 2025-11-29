/**
 * Toast Provider
 * Provides toast notifications using sonner
 */

'use client';

import { Toaster } from '@/components/ui/sonner';
import type { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      <Toaster position="top-center" duration={4000} closeButton={false} richColors={false} />
      {children}
    </>
  );
}
