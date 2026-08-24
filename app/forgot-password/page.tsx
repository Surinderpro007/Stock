'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage('OTP sent to your email');
      setStep('reset');
    } catch {
      setError('Something went wrong, please try again');
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage('Password reset! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch {
      setError('Something went wrong, please try again');
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
        {step === 'email' ? 'Reset Password' : 'Verify & Reset'}
      </p>
      <h2 className="font-serif text-3xl text-[#14140F] mb-8">
        {step === 'email' ? 'Forgot Your Password?' : 'Enter Code & New Password'}
      </h2>

      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-sm text-[#14140F] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm text-[#14140F] mb-1.5">
              OTP sent to {email}
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="6-digit code"
              required
              className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] tracking-widest focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[#14140F] mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 pr-11 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6858] hover:text-[#122A22]"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.4A9.5 9.5 0 0121 12c-.6 1.1-1.4 2.1-2.3 3M6.3 6.3C4.4 7.6 3 9.6 3 12c1.8 3.6 5.4 6 9 6 1 0 2-.2 2.9-.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-sm text-[#6B6858] hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-[#6B6858] text-center">
        Remembered your password?{' '}
        <Link href="/login" className="text-[#122A22] font-medium underline">
          Login here
        </Link>
      </p>
    </AuthLayout>
  );
}