'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

export default function SecurityPage() {
  const router = useRouter();

  // Change password
    // Change email
   const [emailStep, setEmailStep] = useState<'idle' | 'currentOtpSent' | 'enterNewEmail' | 'newOtpSent'>('idle');
  const [currentOtp, setCurrentOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

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
    // Deactivate / Delete account
  const [provider, setProvider] = useState('credentials');
  const [dangerZoneStep, setDangerZoneStep] = useState<'idle' | 'choice' | 'deactivate' | 'delete'>('idle');

  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [deactivating, setDeactivating] = useState(false);

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
      } else {
        // Session invalid/expired 
        router.push('/login');
      }
    }
    fetchProfile();
  }, [router]);

           // Step 1: send OTP to current email
  async function handleSendCurrentEmailOtp() {
    setEmailError('');
    setEmailMessage('');
    setEmailLoading(true);

    try {
      const res = await fetch('/api/request-email-change-otp', { method: 'POST' });
      const data = await res.json();
      setEmailLoading(false);

      if (!res.ok) {
        setEmailError(data.error);
        return;
      }

      setEmailStep('currentOtpSent');
      setEmailMessage('A code has been sent to your current email');
    } catch {
      setEmailError('Something went wrong, please try again');
      setEmailLoading(false);
    }
  }

  // Step 2: verify that OTP
  async function handleVerifyCurrentEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setEmailLoading(true);

    try {
      const res = await fetch('/api/verify-current-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: currentOtp }),
      });
      const data = await res.json();
      setEmailLoading(false);

      if (!res.ok) {
        setEmailError(data.error);
        return;
      }

      setEmailStep('enterNewEmail');
      setCurrentOtp('');
      setEmailMessage('');
    } catch {
      setEmailError('Something went wrong, please try again');
      setEmailLoading(false);
    }
  }

  // Step 3: send OTP to the new email
  async function handleSendNewEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setEmailLoading(true);

    try {
      const res = await fetch('/api/request-new-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });
      const data = await res.json();
      setEmailLoading(false);

      if (!res.ok) {
        setEmailError(data.error);
        return;
      }

      setEmailStep('newOtpSent');
      setEmailMessage(`A code has been sent to ${newEmail}`);
    } catch {
      setEmailError('Something went wrong, please try again');
      setEmailLoading(false);
    }
  }

  // Step 4: verify new email OTP and finalize the change
  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setEmailLoading(true);

    try {
      const res = await fetch('/api/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, otp: emailOtp }),
      });
      const data = await res.json();
      setEmailLoading(false);

      if (!res.ok) {
        setEmailError(data.error);
        return;
      }

      setEmailMessage('Email updated successfully!');
      setEmailStep('idle');
      setNewEmail('');
      setEmailOtp('');
    } catch {
      setEmailError('Something went wrong, please try again');
      setEmailLoading(false);
    }
  }

  function resetEmailFlow() {
    setEmailStep('idle');
    setCurrentOtp('');
    setNewEmail('');
    setEmailOtp('');
    setEmailError('');
    setEmailMessage('');
  }

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

   function resetDangerZone() {
    setDangerZoneStep('idle');
    setDeactivatePassword('');
    setDeactivateError('');
    setDeletePassword('');
    setDeleteOtp('');
    setDeleteOtpSent(false);
    setDeleteError('');
  }

  async function handleDeactivateAccount() {
    setDeactivateError('');
    setDeactivating(true);

    try {
      const res = await fetch('/api/deactivate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isGoogleOnly ? {} : { password: deactivatePassword }),
      });
      const data = await res.json();
      setDeactivating(false);

      if (!res.ok) {
        setDeactivateError(data.error);
        return;
      }

      router.push('/login');
      router.refresh();
    } catch {
      setDeactivateError('Something went wrong, please try again');
      setDeactivating(false);
    }
  }

  async function handleSendDeleteOtp() {
    setDeleteError('');
    setSendingOtp(true);

    try {
      const res = await fetch('/api/request-delete-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isGoogleOnly ? {} : { password: deletePassword }),
      });
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
        body: JSON.stringify({ otp: deleteOtp }),
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
          {/* Change Email */}
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
              Security
            </p>
            <h1 className="font-serif text-3xl text-[#14140F] mb-8">
              Change Email
            </h1>

                                    {emailStep === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-[#6B6858]">
                  We'll first send a code to your current email, then a second code to your new
                  email — both need to be verified before the change is applied.
                </p>
                {emailError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {emailError}
                  </p>
                )}
                {emailMessage && (
                  <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2">
                    {emailMessage}
                  </p>
                )}
                <button
                  onClick={handleSendCurrentEmailOtp}
                  disabled={emailLoading}
                  className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
                >
                  {emailLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {emailStep === 'currentOtpSent' && (
              <form onSubmit={handleVerifyCurrentEmailOtp} className="space-y-5">
                <p className="text-sm text-[#6B6858]">Step 1 of 2 — verify your current email</p>

                <div>
                  <label className="block text-sm text-[#14140F] mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={currentOtp}
                    onChange={(e) => setCurrentOtp(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit code"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] tracking-widest focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
                  />
                </div>

                {emailError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {emailError}
                  </p>
                )}
                {emailMessage && (
                  <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2">
                    {emailMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
                >
                  {emailLoading ? 'Verifying...' : 'Verify Code'}
                </button>

                <button
                  type="button"
                  onClick={resetEmailFlow}
                  className="w-full text-sm text-[#6B6858] hover:underline"
                >
                  Cancel
                </button>
              </form>
            )}

            {emailStep === 'enterNewEmail' && (
              <form onSubmit={handleSendNewEmailOtp} className="space-y-5">
                <p className="text-sm text-[#6B6858]">
                  Step 2 of 2 — enter your new email, we'll send a code there too
                </p>

                <div>
                  <label className="block text-sm text-[#14140F] mb-1.5">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
                  />
                </div>

                {emailError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {emailError}
                  </p>
                )}
                {emailMessage && (
                  <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2">
                    {emailMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
                >
                  {emailLoading ? 'Sending...' : 'Send Code to New Email'}
                </button>

                <button
                  type="button"
                  onClick={resetEmailFlow}
                  className="w-full text-sm text-[#6B6858] hover:underline"
                >
                  Cancel
                </button>
              </form>
            )}

            {emailStep === 'newOtpSent' && (
              <form onSubmit={handleChangeEmail} className="space-y-5">
                <p className="text-sm text-[#6B6858]">
                  Code sent to <span className="text-[#14140F] font-medium">{newEmail}</span>
                </p>

                <div>
                  <label className="block text-sm text-[#14140F] mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit code"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] tracking-widest focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
                  />
                </div>

                {emailError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {emailError}
                  </p>
                )}
                {emailMessage && (
                  <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2">
                    {emailMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
                >
                  {emailLoading ? 'Updating...' : 'Update Email'}
                </button>

                <button
                  type="button"
                  onClick={resetEmailFlow}
                  className="w-full text-sm text-[#6B6858] hover:underline"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* Change Password */}
          <div className="border-t border-[#DDD8CC] pt-10">
            <h2 className="font-serif text-2xl text-[#14140F] mb-8">
              Change Password
            </h2>

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
              You can temporarily deactivate your account, or delete it permanently.
            </p>

            {dangerZoneStep === 'idle' && (
              <button
                onClick={() => setDangerZoneStep('choice')}
                className="w-full border border-red-300 text-red-700 py-2.5 rounded-md font-medium hover:bg-red-50 transition-colors"
              >
                Deactivate or Delete Account
              </button>
            )}

            {dangerZoneStep === 'choice' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#14140F] mb-1">Deactivate Account</p>
                  <p className="text-xs text-[#6B6858] mb-2">
                    Your account is closed right away and hidden from everyone except an admin.
                    Only an admin can reactivate it for you.
                  </p>
                  <button
                    onClick={() => setDangerZoneStep('deactivate')}
                    className="w-full border border-[#DDD8CC] bg-white text-[#14140F] py-2 rounded-md text-sm hover:bg-[#F7F5EF] transition-colors"
                  >
                    Deactivate Account
                  </button>
                </div>

                <div className="border-t border-red-200 pt-4">
                  <p className="text-sm font-medium text-red-700 mb-1">Delete Account</p>
                  <p className="text-xs text-[#6B6858] mb-2">
                    Your account is permanently deleted after 30 days. If you log back in before
                    then, the deletion is cancelled automatically.
                  </p>
                  <button
                    onClick={() => setDangerZoneStep('delete')}
                    className="w-full bg-red-700 text-white py-2 rounded-md text-sm hover:bg-red-800 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>

                <button
                  onClick={resetDangerZone}
                  className="w-full text-sm text-[#6B6858] py-1 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {dangerZoneStep === 'deactivate' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
                {isGoogleOnly ? (
                  <p className="text-sm text-red-700">Confirm you want to deactivate your account.</p>
                ) : (
                  <>
                    <p className="text-sm text-red-700">Enter your password to confirm deactivation.</p>
                    <input
                      type="password"
                      value={deactivatePassword}
                      onChange={(e) => setDeactivatePassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-md text-[#14140F] focus:outline-none focus:border-red-400 transition-colors"
                    />
                  </>
                )}
                {deactivateError && <p className="text-sm text-red-700">{deactivateError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={resetDangerZone}
                    className="flex-1 border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeactivateAccount}
                    disabled={deactivating}
                    className="flex-1 bg-red-700 text-white py-2 rounded-md text-sm hover:bg-red-800 disabled:opacity-50 transition-colors"
                  >
                    {deactivating ? 'Deactivating...' : 'Confirm Deactivate'}
                  </button>
                </div>
              </div>
            )}

            {dangerZoneStep === 'delete' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
                {!deleteOtpSent ? (
                  <>
                    {isGoogleOnly ? (
                      <p className="text-sm text-red-700">
                        This account uses Google Sign-In. We'll send a verification code to your
                        email to confirm deletion.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-red-700">Enter your password to continue.</p>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Your password"
                          className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-md text-[#14140F] focus:outline-none focus:border-red-400 transition-colors"
                        />
                      </>
                    )}
                    {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={resetDangerZone}
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
                      Enter the code sent to your email. Your account will then be scheduled for
                      deletion in 30 days — logging back in before that cancels it.
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
                        onClick={resetDangerZone}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}