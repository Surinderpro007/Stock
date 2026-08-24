import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EF]">
      {/* Top nav */}
      <header className="flex items-center justify-between px-8 py-6">
        <span className="font-serif text-xl text-[#122A22]">AuthApp</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-[#122A22] font-medium hover:underline"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm bg-[#122A22] text-[#F7F5EF] rounded-md font-medium hover:bg-[#0D1F19] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-4 uppercase">
            Auth App // Secure Access
          </p>
          <h1 className="font-serif text-5xl text-[#14140F] leading-tight mb-6">
            Secure Your Digital World with Confidence
          </h1>
          <p className="text-[#6B6858] text-base leading-relaxed mb-10">
            Simple, secure authentication with profile management built in.
            Sign up in seconds and keep your account protected.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-[#122A22] text-[#F7F5EF] rounded-md font-medium hover:bg-[#0D1F19] transition-colors"
            >
              Create an Account
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-[#DDD8CC] text-[#122A22] rounded-md font-medium hover:bg-[#EFEDE4] transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#6B6858] font-mono">
        © {new Date().getFullYear()} AuthApp — All rights reserved.
      </footer>
    </div>
  );
}