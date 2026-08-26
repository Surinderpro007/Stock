'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<'login' | 'twofa'>('login');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('error') === 'google_auth_failed') {
    setError('Google authentication failed. Please try again.');
  }
}, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rememberMe }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (data.error === 'NEEDS_VERIFICATION') {
          setError('Please verify your email first.');
          await fetch('/api/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email }),
          });
          router.push(`/register`);
          return;
        }
        setError(data.error);
        return;
      }

      if (data.requiresTwoFA) {
        setMessage('A verification code has been sent to your email');
        setStep('twofa');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Something went wrong, please try again');
      setLoading(false);
    }
  }

  async function handleVerifyTwoFA(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp, rememberMe }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong, please try again');
      setLoading(false);
    }
  }

  if (step === 'twofa') {
    return (
      <AuthLayout>
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
          Two-Factor Authentication
        </p>
        <h2 className="font-serif text-3xl text-[#14140F] mb-8">
          Enter Your Code
        </h2>

        <form onSubmit={handleVerifyTwoFA} className="space-y-5">
          <div>
            <label className="block text-sm text-[#14140F] mb-1.5">
              Code sent to {formData.email}
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
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
        Welcome Back
      </p>
      <h2 className="font-serif text-3xl text-[#14140F] mb-8">
        Login With Your Account
      </h2>

      <a
        href="/api/auth/google"
        className="w-full flex items-center justify-center gap-3 border border-[#DDD8CC] bg-white text-[#14140F] py-2.5 rounded-md font-medium hover:bg-[#F7F5EF] transition-colors mb-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 01-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A11.997 11.997 0 0012 24z" />
          <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 010-4.54V6.64H1.28a12 12 0 000 10.72l3.99-3.09z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.64l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
        </svg>
        Continue with Google
      </a>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 border-t border-[#DDD8CC]" />
        <span className="text-xs text-[#6B6858] font-mono uppercase">or</span>
        <div className="flex-1 border-t border-[#DDD8CC]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-[#14140F] mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-[#14140F] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 pr-11 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#14140F] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#DDD8CC] text-[#122A22] focus:ring-[#B8935F] cursor-pointer"
            />
            Remember me
          </label>

          <Link href="/forgot-password" className="text-sm text-[#122A22] underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#6B6858] text-center">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#122A22] font-medium underline">
          Register here
        </Link>
      </p>
    </AuthLayout>
  );
}