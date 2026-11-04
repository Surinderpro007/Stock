import { formatPercent, formatRupee, formatSignedRupee } from '../../lib/formatMoney';
import type { Portfolio } from '../../lib/api/portfolio';

function Card({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const color =
    tone === 'up' ? 'text-[#2F6B4F]' : tone === 'down' ? 'text-[#9B3A32]' : 'text-[#14140F]';

  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white px-4 py-4">
      <p className="font-mono text-[10px] tracking-[0.2em] text-[#B8935F] uppercase mb-2">{label}</p>
      <p className={`text-lg font-medium ${color}`}>{value}</p>
    </div>
  );
}

export default function SummaryCards({ portfolio }: { portfolio: Portfolio }) {
  const tone = portfolio.profitLossAmount > 0 ? 'up' : portfolio.profitLossAmount < 0 ? 'down' : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <Card label="Available balance" value={formatRupee(portfolio.balance)} />
      <Card label="Total invested" value={formatRupee(portfolio.totalInvested)} />
      <Card label="Current value" value={formatRupee(portfolio.currentValue)} />
      <Card
        label="Profit / loss"
        value={`${formatSignedRupee(portfolio.profitLossAmount)} (${formatPercent(portfolio.profitLossPercent)})`}
        tone={tone}
      />
    </div>
  );
}
