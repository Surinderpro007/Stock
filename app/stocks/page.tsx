import MarketShell from '../components/MarketShell';
import StocksClient from './StocksClient';

export default function StocksPage() {
  return (
    <MarketShell>
      <StocksClient />
    </MarketShell>
  );
}
