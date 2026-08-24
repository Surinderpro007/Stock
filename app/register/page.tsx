'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage('A verification code has been sent to your email');
      setStep('verify');
    } catch {
      setError('Something went wrong, please try again');
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push('/login');
    } catch {
      setError('Something went wrong, please try again');
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setMessage('A new code has been sent');
    } catch {
      setError('Something went wrong');
    }
  }

  if (step === 'verify') {
    return (
      <AuthLayout>
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
          Almost There
        </p>
        <h2 className="font-serif text-3xl text-[#14140F] mb-8">
          Verify Your Email
        </h2>

        <form onSubmit={handleVerify} className="space-y-5">
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
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="w-full text-sm text-[#6B6858] hover:underline"
          >
            Resend code
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
        Get Started
      </p>
      <h2 className="font-serif text-3xl text-[#14140F] mb-8">
        Create Your Account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-[#14140F] mb-1.5">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
          />
        </div>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#6B6858] text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-[#122A22] font-medium underline">
          Login here
        </Link>
      </p>
    </AuthLayout>
  );
}