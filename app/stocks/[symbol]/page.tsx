import MarketShell from '../../components/MarketShell';
import StockDetailClient from './StockDetailClient';

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  return (
    <MarketShell>
      <StockDetailClient symbol={symbol.toUpperCase()} />
    </MarketShell>
  );
}
