import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-6">
      <Link href="/" className="font-serif text-xl text-[#122A22]">
        StockApps
      </Link>
      <div className="flex gap-3">
        <Link href="/login" className="px-4 py-2 text-sm text-[#122A22] font-medium hover:underline">
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
  );
}
