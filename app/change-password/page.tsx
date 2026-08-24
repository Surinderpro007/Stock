'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

export default function SecurityPage() {
  const router = useRouter();

  // Change password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState('');

  // Delete account
  const [provider, setProvider] = useState('credentials');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setTwoFAEnabled(Boolean(data.user.twoFAEnabled));
        setProvider(data.user.provider || 'credentials');
      }
    }
    fetchProfile();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMessage('');
    setPwSaving(true);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      setPwSaving(false);

      if (!res.ok) {
        setPwError(data.error);
        return;
      }

      setPwMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch {
      setPwError('Something went wrong, please try again');
      setPwSaving(false);
    }
  }

  async function handleToggleTwoFA() {
    setTwoFALoading(true);
    setTwoFAMessage('');
    const newValue = !twoFAEnabled;

    try {
      const res = await fetch('/api/two-fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: newValue }),
      });
      const data = await res.json();
      setTwoFALoading(false);

      if (!res.ok) {
        setTwoFAMessage(data.error);
        return;
      }

      setTwoFAEnabled(newValue);
      setTwoFAMessage(data.message);
    } catch {
      setTwoFAMessage('Something went wrong');
      setTwoFALoading(false);
    }
  }

    const isGoogleOnly = provider === 'google';

  async function handleSendDeleteOtp() {
    setDeleteError('');
    setSendingOtp(true);

    try {
      const res = await fetch('/api/request-delete-otp', { method: 'POST' });
      const data = await res.json();
      setSendingOtp(false);

      if (!res.ok) {
        setDeleteError(data.error);
        return;
      }

      setDeleteOtpSent(true);
    } catch {
      setDeleteError('Something went wrong, please try again');
      setSendingOtp(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('');
    setDeleting(true);

    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGoogleOnly ? { otp: deleteOtp } : { password: deletePassword }
        ),
      });
      const data = await res.json();
      setDeleting(false);

      if (!res.ok) {
        setDeleteError(data.error);
        return;
      }

      router.push('/login');
      router.refresh();
    } catch {
      setDeleteError('Something went wrong, please try again');
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <Navbar />

      <div className="flex justify-center px-6 py-16">
        <div className="max-w-md w-full space-y-12">
          {/* Change Password */}
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
              Security
            </p>
            <h1 className="font-serif text-3xl text-[#14140F] mb-8">
              Change Password
            </h1>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm text-[#14140F] mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-[#14140F] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
                />
              </div>

              {pwError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {pwError}
                </p>
              )}
              {pwMessage && (
                <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2">
                  {pwMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={pwSaving}
                className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
              >
                {pwSaving ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* 2FA */}
          <div className="border-t border-[#DDD8CC] pt-10">
            <h2 className="font-serif text-2xl text-[#14140F] mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-[#6B6858] mb-5">
              When enabled, you'll need to enter a code sent to your email every time you log in.
            </p>

            <div className="flex items-center justify-between bg-white border border-[#DDD8CC] rounded-md p-4">
              <span className="text-sm text-[#14140F] font-medium">
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={handleToggleTwoFA}
                disabled={twoFALoading}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  twoFAEnabled ? 'bg-[#122A22]' : 'bg-[#DDD8CC]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    twoFAEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {twoFAMessage && (
              <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2 mt-3">
                {twoFAMessage}
              </p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="border-t border-red-200 pt-10">
            <h2 className="font-serif text-2xl text-red-700 mb-2">Danger Zone</h2>
            <p className="text-sm text-[#6B6858] mb-5">
              Deleting your account is permanent and cannot be undone.
            </p>

                        {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border border-red-300 text-red-700 py-2.5 rounded-md font-medium hover:bg-red-50 transition-colors"
              >
                Delete My Account
              </button>
            ) : isGoogleOnly ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
                {!deleteOtpSent ? (
                  <>
                    <p className="text-sm text-red-700">
                      This account uses Google Sign-In. We'll send a verification code to your email to confirm deletion.
                    </p>
                    {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteError('');
                        }}
                        className="flex-1 border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendDeleteOtp}
                        disabled={sendingOtp}
                        className="flex-1 bg-red-700 text-white py-2 rounded-md text-sm hover:bg-red-800 disabled:opacity-50 transition-colors"
                      >
                        {sendingOtp ? 'Sending...' : 'Send Code'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-red-700">
                      Enter the verification code sent to your email to confirm deletion.
                    </p>
                    <input
                      type="text"
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value)}
                      maxLength={6}
                      placeholder="6-digit code"
                      className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-md text-[#14140F] tracking-widest focus:outline-none focus:border-red-400 transition-colors"
                    />
                    {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteOtpSent(false);
                          setDeleteOtp('');
                          setDeleteError('');
                        }}
                        className="flex-1 border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex-1 bg-red-700 text-white py-2 rounded-md text-sm hover:bg-red-800 disabled:opacity-50 transition-colors"
                      >
                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
                <p className="text-sm text-red-700">
                  Enter your password to confirm account deletion.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-md text-[#14140F] focus:outline-none focus:border-red-400 transition-colors"
                />
                {deleteError && (
                  <p className="text-sm text-red-700">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                    className="flex-1 border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 bg-red-700 text-white py-2 rounded-md text-sm hover:bg-red-800 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}