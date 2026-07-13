'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/lib/app-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthInitialized } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthInitialized) return;

    const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.push('/login');
    } else if (isAuthenticated && isPublicPath) {
      router.push('/');
    }
  }, [isAuthenticated, isAuthInitialized, pathname, router]);

  // Don't render children until we've checked localStorage for a token
  if (!isAuthInitialized) {
    return null; // Or a full-page loader
  }

  return <>{children}</>;
}
