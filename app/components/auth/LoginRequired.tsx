'use client';

import Link from 'next/link';

export default function LoginRequired({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14140F]/40 px-4">
      <div className="w-full max-w-sm bg-white border border-[#DDD8CC] rounded-md shadow-lg p-6 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
          Restricted
        </p>
        <h2 className="font-serif text-2xl text-[#14140F] mb-3">Full access needed</h2>
        <p className="text-sm text-[#6B6858] leading-relaxed mb-6">
          Please log in to get full access
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="px-4 py-2.5 text-sm bg-[#122A22] text-[#F7F5EF] rounded-md font-medium hover:bg-[#0D1F19] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2.5 text-sm border border-[#DDD8CC] text-[#122A22] rounded-md font-medium hover:bg-[#F7F5EF] transition-colors"
          >
            Register
          </Link>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-sm text-[#6B6858] hover:underline"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
