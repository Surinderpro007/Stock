'use client';

import Link from 'next/link';

interface CourseModule {
  step: string;
  title: string;
  level: string;
  description: string;
  topics: string[];
}

const MODULES: CourseModule[] = [
  {
    step: '01',
    title: 'Market Foundations & NSE Dynamics',
    level: 'Beginner',
    description:
      'Understand how the National Stock Exchange matches buyers and sellers, how price discovery works, and what market orders vs limit orders mean.',
    topics: ['Order Book Mechanics', 'Bid-Ask Spread Dynamics', 'Trading Hours & Pre-Market Sessions'],
  },
  {
    step: '02',
    title: 'Technical Analysis & Candlestick Reading',
    level: 'Intermediate',
    description:
      'Learn how to read bullish and bearish candlestick patterns, interpret Exponential Moving Averages (EMA 20/50/200), and use RSI for momentum confirmation.',
    topics: ['Support & Resistance Zones', 'Trendline Breakouts', 'Volume-Price Confirmation'],
  },
  {
    step: '03',
    title: 'Risk Management & Position Sizing',
    level: 'Intermediate',
    description:
      'Discover the mathematical principles behind sustainable capital growth. Calculate risk-to-reward ratios and prevent catastrophic drawdowns.',
    topics: ['The 2% Rule of Capital Protection', 'Portfolio Asset Allocation', 'Sector Correlation Risks'],
  },
  {
    step: '04',
    title: 'Hands-on Paper Trading & Strategy Testing',
    level: 'Applied Practice',
    description:
      'Put theoretical knowledge into practice. Execute simulated trades using real NSE prices and ₹1,00,000 virtual balance to refine your edge.',
    topics: ['Simulated Order Execution', 'Real-Time P&L Accounting', 'Trade Journaling & Reflection'],
  },
];

export default function EducationSection() {
  return (
    <section className="mb-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase mb-2">
          Financial Academy // Zero Risk
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-[#14140F] mb-3">
          Master the Stock Market Step-by-Step
        </h2>
        <p className="text-sm md:text-base text-[#6B6858] leading-relaxed">
          From your very first market order to advanced risk management, build genuine trading
          confidence through structured education and live simulated practice.
        </p>
      </div>

      {/* 4 Curriculum Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {MODULES.map((mod) => (
          <div
            key={mod.step}
            className="bg-white border border-[#DDD8CC] rounded-lg p-6 shadow-xs hover:border-[#B8935F] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DDD8CC] mb-4">
                <span className="font-mono text-xs font-bold text-[#B8935F] tracking-widest">
                  MODULE {mod.step}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F5EF] text-[#122A22] border border-[#DDD8CC]">
                  {mod.level}
                </span>
              </div>
              <h3 className="font-serif text-xl text-[#14140F] mb-2">{mod.title}</h3>
              <p className="text-xs text-[#6B6858] leading-relaxed mb-4">{mod.description}</p>
            </div>

            <div className="pt-3 border-t border-[#EFEDE4]">
              <span className="text-[10px] font-mono text-[#6B6858] uppercase tracking-wider block mb-2">
                Core Topics Covered:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {mod.topics.map((t, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F5EF] text-[#122A22] border border-[#EFEDE4]"
                  >
                    • {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Academy Banner Callout */}
      <div className="bg-[#122A22] text-[#F7F5EF] rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="font-mono text-xs text-[#B8935F] uppercase tracking-widest block mb-1">
            Zero Financial Risk Playground
          </span>
          <h3 className="font-serif text-2xl text-white mb-2">
            Practice with ₹1,00,000 Virtual Capital
          </h3>
          <p className="text-xs text-white/70 max-w-lg leading-relaxed">
            Every account is seeded with a simulated cash wallet. Test ideas, buy shares, and track your
            P&L across real NSE market movements without risking a single rupee.
          </p>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
          <Link
            href="/stocks"
            className="px-5 py-2.5 text-xs font-mono bg-[#B8935F] text-[#122A22] font-semibold rounded-md hover:bg-[#A37E4C] transition-colors shadow-xs text-center"
          >
            Start Practice Trading →
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-xs font-mono bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors border border-white/20 text-center"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </section>
  );
}
