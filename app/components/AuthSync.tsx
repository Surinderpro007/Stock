'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'logout-event') {
        router.push('/login');
        router.refresh();
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  return null;
}