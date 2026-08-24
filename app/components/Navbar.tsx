// app/components/Navbar.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileData {
  name: string;
  profileImage: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
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
      }
    }
    fetchProfile();
  }, []);

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

  return (
    <nav className="w-full bg-[#122A22] px-6 py-4 flex items-center justify-between relative">
      {/* Left: Logo */}
      <Link href="/dashboard" className="font-serif text-xl text-[#F7F5EF]">
        AuthApp
      </Link>

      {/* Middle: Nav items */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href="/dashboard"
          className="text-sm text-[#F7F5EF] hover:text-[#B8935F] transition-colors"
        >
          Home
        </Link>
      </div>

      {/* Right: Avatar with dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="w-9 h-9 rounded-full bg-[#DDD8CC] overflow-hidden flex items-center justify-center border-2 border-transparent hover:border-[#B8935F] transition-colors"
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
          <div className="absolute right-0 top-12 w-48 bg-white border border-[#DDD8CC] rounded-md shadow-lg py-1.5 z-50">
            <Link
              href="/profile"
              onClick={() => setShowMenu(false)}
              className="block px-4 py-2 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
            >
              View Profile
            </Link>
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
            <button
              onClick={() => {
                setShowMenu(false);
                setShowConfirm(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#14140F] hover:bg-[#F7F5EF] transition-colors"
            >
              Logout
            </button>
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