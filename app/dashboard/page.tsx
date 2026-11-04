// app/dashboard/page.tsx

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import ContextualMarketNews from '../components/news/ContextualMarketNews';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const decoded = jwt.verify(
    token as string,
    process.env.JWT_SECRET as string
  ) as DecodedToken;

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center max-w-xl mx-auto py-8">
          <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
            Account Dashboard
          </p>
          <h1 className="font-serif text-4xl text-[#14140F] mb-2">
            Welcome, {decoded.name}!
          </h1>
          <p className="text-[#6B6858] text-sm mb-6">{decoded.email}</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/stocks"
              className="px-5 py-2.5 text-sm bg-[#122A22] text-[#F7F5EF] rounded-md font-medium hover:bg-[#0D1F19] transition-colors shadow-xs"
            >
              Browse stocks
            </Link>
            <Link
              href="/portfolio"
              className="px-5 py-2.5 text-sm border border-[#DDD8CC] text-[#122A22] rounded-md font-medium hover:bg-[#EFEDE4] transition-colors"
            >
              Portfolio
            </Link>
            <Link
              href="/wallet"
              className="px-5 py-2.5 text-sm border border-[#DDD8CC] text-[#122A22] rounded-md font-medium hover:bg-[#EFEDE4] transition-colors"
            >
              Wallet
            </Link>
            <Link
              href="/news"
              className="px-5 py-2.5 text-sm border border-[#DDD8CC] text-[#122A22] rounded-md font-medium hover:bg-[#EFEDE4] transition-colors"
            >
              Market News
            </Link>
          </div>
        </div>

        {/* Contextual Market News Section */}
        <ContextualMarketNews
          title="Market Pulse & Financial Wire"
          subtitle="Real-time Indian equity movements, sector highlights, and economic intelligence"
          limit={4}
        />
      </main>
    </div>
  );
}
