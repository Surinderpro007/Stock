import MarketShell from '../components/MarketShell';
import TransactionsClient from './TransactionsClient';

export default function TransactionsPage() {
  return (
    <MarketShell>
      <TransactionsClient />
    </MarketShell>
  );
}
