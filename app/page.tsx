import { cookies } from 'next/headers';
import Link from 'next/link';
import PublicStockList from './components/stocks/PublicStockList';
import ContextualMarketNews from './components/news/ContextualMarketNews';
import MarketIndicesBar from './components/home/MarketIndicesBar';
import MultiAssetSection from './components/home/MultiAssetSection';
import MarketDataSection from './components/home/MarketDataSection';
import ExperienceSection from './components/home/ExperienceSection';
import TradersInvestorsSection from './components/home/TradersInvestorsSection';
import EducationSection from './components/home/EducationSection';

const { listStocks } = require('../controllers/stockController');

export const dynamic = 'force-dynamic';

async function getAllStocks() {
  try {
    return await listStocks({
      sortBy: 'symbol',
      order: 'asc',
      includeChange: true,
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get('token')?.value);
  const allStocks = await getAllStocks();
  const indianStocks = allStocks.filter((stock) => !stock.market || stock.market === 'IN');
  const snapshotStocks = indianStocks.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EF]">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 md:px-8 py-6 border-b border-[#EFEDE4] bg-[#F7F5EF]">
        <span className="font-serif text-xl text-[#122A22]">StockApp</span>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md font-medium hover:bg-[#0D1F19] transition-colors shadow-xs"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-mono text-[#122A22] font-medium hover:underline"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md font-medium hover:bg-[#0D1F19] transition-colors shadow-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <section className="text-center pt-12 pb-14 max-w-2xl mx-auto">
            <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-4 uppercase">
              Stock App // Virtual Market
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#14140F] leading-tight mb-6">
              Learn the market with virtual rupees
            </h1>
            <p className="text-[#6B6858] text-base leading-relaxed mb-8">
              Browse listed Indian stocks, then log in to open charts, buy, sell, and track a
              practice portfolio. No real money is involved.
            </p>

            {!isLoggedIn ? (
              <div className="flex items-center justify-center gap-3.5 flex-wrap">
                <Link
                  href="/register"
                  className="px-6 py-3 bg-[#122A22] text-[#F7F5EF] rounded-md text-xs font-mono font-medium hover:bg-[#0D1F19] transition-colors shadow-xs"
                >
                  Create an Account
                </Link>
                <Link
                  href="/stocks"
                  className="px-6 py-3 border border-[#DDD8CC] text-[#122A22] rounded-md text-xs font-mono font-medium hover:bg-[#EFEDE4] transition-colors"
                >
                  Explore Listed Stocks
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3.5 flex-wrap">
                <Link
                  href="/stocks"
                  className="px-6 py-3 bg-[#122A22] text-[#F7F5EF] rounded-md text-xs font-mono font-medium hover:bg-[#0D1F19] transition-colors shadow-xs"
                >
                  View Market Screener →
                </Link>
                <Link
                  href="/portfolio"
                  className="px-6 py-3 border border-[#DDD8CC] text-[#122A22] rounded-md text-xs font-mono font-medium hover:bg-[#EFEDE4] transition-colors"
                >
                  My Portfolio
                </Link>
              </div>
            )}
          </section>

          {/* Major Benchmark Indices Ticker with Live Aggregated Data */}
          <MarketIndicesBar stocks={indianStocks} />

          {/* Listed Stocks / Market Snapshot */}
          <section className="mb-20">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-1.5 uppercase">
                  Listed stocks
                </p>
                <h2 className="font-serif text-2xl md:text-3xl text-[#14140F]">Market snapshot</h2>
              </div>
              <Link
                href="/stocks"
                className="text-xs font-mono text-[#122A22] hover:text-[#B8935F] hover:underline"
              >
                View all stocks →
              </Link>
            </div>
            <PublicStockList stocks={snapshotStocks} isLoggedIn={isLoggedIn} />
            {!isLoggedIn && (
              <p className="mt-3 text-center text-xs text-[#6B6858] font-mono">
                Charts, buy, sell, and portfolio require an account.
              </p>
            )}
          </section>

          {/* Section: Trade & Invest from One App with Live Sector Baskets */}
          <MultiAssetSection stocks={allStocks} />

          {/* Section: Market Data with Real API Charts and Live Breadth */}
          <MarketDataSection stocks={allStocks} />

          {/* Section: Mobile & Desktop trading experience with Real Ticker Quotes */}
          <ExperienceSection stocks={allStocks} />

          {/* Section: Traders & Investors feature highlights */}
          <TradersInvestorsSection />

          {/* Section: Learning / Education Academy */}
          <EducationSection />

          {/* Contextual Market News Wire */}
          <section className="mb-16">
            <ContextualMarketNews
              title="Latest Market Wire"
              subtitle="Real-time financial headlines and Indian exchange updates"
              limit={4}
            />
          </section>

          {/* Final Call to Action Box */}
          <section className="bg-white border border-[#DDD8CC] rounded-lg p-8 md:p-12 text-center shadow-xs mb-10">
            <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase mb-3">
              Zero Risk • Real Market Experience
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#14140F] mb-4">
              Ready to begin your trading journey?
            </h2>
            <p className="text-sm md:text-base text-[#6B6858] max-w-xl mx-auto mb-8 leading-relaxed">
              Open your free virtual practice account in under 30 seconds. Receive ₹1,00,000 demo
              funds immediately and start testing real strategies on live NSE quotes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href={isLoggedIn ? '/stocks' : '/register'}
                className="px-6 py-3 bg-[#122A22] text-[#F7F5EF] rounded-md text-xs font-mono font-medium hover:bg-[#0D1F19] transition-colors shadow-xs"
              >
                {isLoggedIn ? 'Explore Market Watch →' : 'Create Free Account →'}
              </Link>
              <Link
                href="/stocks"
                className="px-6 py-3 border border-[#DDD8CC] text-[#122A22] rounded-md text-xs font-mono font-medium hover:bg-[#EFEDE4] transition-colors"
              >
                Browse Equities
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-8 px-6 text-center text-xs text-[#6B6858] font-mono border-t border-[#EFEDE4] bg-[#F7F5EF]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} StockApp — Virtual trading for learning only</span>
          <span className="text-[11px] text-[#B8935F]">
            NSE & BSE quotes for educational simulation • No real money involved
          </span>
        </div>
      </footer>
    </div>
  );
}
