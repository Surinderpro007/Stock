// app/components/Navbar.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface ProfileData {
  name: string;
  profileImage: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const data = await res.json();

      if (res.ok) {
        setProfile({ name: data.user.name, profileImage: data.user.profileImage, role: data.user.role });
        return;
      }

      // Account got suspended/deactivated/deleted while this tab was open — force logout now.
      if (data.blocked) {
        localStorage.setItem('logout-event', Date.now().toString());
        router.push('/login?blocked=1');
        router.refresh();
      }
    }

    fetchProfile();

    // Poll periodically so an already-open tab reacts within seconds,
    // instead of only on the next navigation/reload.
    const interval = setInterval(fetchProfile, 20000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    localStorage.setItem('logout-event', Date.now().toString());
    setShowConfirm(false);
    router.push('/login');
    router.refresh();
  }

  const isCurrent = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="w-full bg-[#122A22] px-6 py-4 flex items-center justify-between relative shadow-sm">
      {/* Left: Logo */}
      <Link href="/dashboard" className="font-serif text-xl text-[#F7F5EF] hover:text-[#B8935F] transition-colors">
        StockApp
      </Link>

      {/* Middle: Nav items - Only shown to authenticated users who see this Navbar */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href="/dashboard"
          className={`text-sm transition-colors ${
            isCurrent('/dashboard') ? 'text-[#B8935F] font-medium' : 'text-[#F7F5EF] hover:text-[#B8935F]'
          }`}
        >
          Home
        </Link>
        <Link
          href="/stocks"
          className={`text-sm transition-colors ${
            isCurrent('/stocks') ? 'text-[#B8935F] font-medium' : 'text-[#F7F5EF] hover:text-[#B8935F]'
          }`}
        >
          Stocks
        </Link>
        <Link
          href="/watchlist"
          className={`text-sm transition-colors ${
            isCurrent('/watchlist') ? 'text-[#B8935F] font-medium' : 'text-[#F7F5EF] hover:text-[#B8935F]'
          }`}
        >
          Watchlist
        </Link>
        <Link
          href="/portfolio"
          className={`text-sm transition-colors ${
            isCurrent('/portfolio') ? 'text-[#B8935F] font-medium' : 'text-[#F7F5EF] hover:text-[#B8935F]'
          }`}
        >
          Portfolio
        </Link>
        <Link
          href="/wallet"
          className={`text-sm transition-colors ${
            isCurrent('/wallet') ? 'text-[#B8935F] font-medium' : 'text-[#F7F5EF] hover:text-[#B8935F]'
          }`}
        >
          Wallet
        </Link>
        <Link
          href="/news"
          className={`text-sm transition-colors ${
            isCurrent('/news') ? 'text-[#B8935F] font-medium' : 'text-[#F7F5EF] hover:text-[#B8935F]'
          }`}
        >
          News
        </Link>
        {profile?.role === 'admin' && (
          <Link
            href="/admin"
            className={`text-sm transition-colors ${
              isCurrent('/admin') ? 'text-[#B8935F] font-medium' : 'text-[#F7F5EF] hover:text-[#B8935F]'
            }`}
          >
            Admin
          </Link>
        )}
      </div>

      {/* Right: Avatar with dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="w-9 h-9 rounded-full bg-[#DDD8CC] overflow-hidden flex items-center justify-center border-2 border-transparent hover:border-[#B8935F] transition-colors"
          aria-label="User menu"
        >
          {profile?.profileImage ? (
            <img
              src={profile.profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-serif text-[#6B6858]">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : '...'}
            </span>
          )}
        </button>

        {showMenu && (
          <div className="absolute right-0 top-12 w-52 bg-white border border-[#DDD8CC] rounded-md shadow-lg py-1.5 z-50">
            {profile?.name && (
              <div className="px-4 py-2 border-b border-[#EFEDE4]">
                <p className="text-xs text-[#6B6858]">Signed in as</p>
                <p className="text-sm font-medium text-[#14140F] truncate">{profile.name}</p>
              </div>
            )}
            <Link
              href="/profile"
              onClick={() => setShowMenu(false)}
              className="block px-4 py-2 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
            >
              View Profile
            </Link>
            {/* Mobile-only nav shortcuts */}
            <div className="md:hidden border-t border-[#EFEDE4] my-1">
              <Link
                href="/stocks"
                onClick={() => setShowMenu(false)}
                className="block px-4 py-1.5 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
              >
                Stocks
              </Link>
              <Link
                href="/watchlist"
                onClick={() => setShowMenu(false)}
                className="block px-4 py-1.5 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
              >
                Watchlist
              </Link>
              <Link
                href="/portfolio"
                onClick={() => setShowMenu(false)}
                className="block px-4 py-1.5 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
              >
                Portfolio
              </Link>
              <Link
                href="/wallet"
                onClick={() => setShowMenu(false)}
                className="block px-4 py-1.5 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
              >
                Wallet
              </Link>
              <Link
                href="/news"
                onClick={() => setShowMenu(false)}
                className="block px-4 py-1.5 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
              >
                News
              </Link>
            </div>
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setShowMenu(false)}
                className="block px-4 py-2 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/change-password"
              onClick={() => setShowMenu(false)}
              className="block px-4 py-2 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
            >
              Change Password
            </Link>
            <div className="border-t border-[#EFEDE4] mt-1 pt-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowConfirm(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-[#9B3A32] hover:bg-[#F7F5EF] transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="absolute right-0 top-12 w-64 bg-white border border-[#DDD8CC] rounded-md shadow-lg p-4 z-50">
            <p className="text-sm text-[#14140F] mb-4">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm px-3 py-1.5 rounded-md border border-[#DDD8CC] text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-md bg-[#122A22] text-[#F7F5EF] hover:bg-[#0D1F19] transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
