import { formatPercent, formatSignedPrice } from '../../lib/formatMoney';

export default function PriceChange({
  amount,
  percent,
  currency = 'INR',
}: {
  amount?: number;
  percent?: number;
  currency?: string;
}) {
  if (amount === undefined || percent === undefined) {
    return <span className="text-sm text-[#6B6858]">—</span>;
  }

  const up = amount >= 0;
  const color = up ? 'text-[#2F6B4F]' : 'text-[#9B3A32]';

  return (
    <span className={`text-sm font-medium ${color}`}>
      {formatSignedPrice(amount, currency)} ({formatPercent(percent)})
    </span>
  );
}
