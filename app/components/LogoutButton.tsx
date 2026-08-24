'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    localStorage.setItem('logout-event', Date.now().toString());
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-[#122A22] font-medium underline hover:text-[#0D1F19]"
    >
      Logout
    </button>
  );
}