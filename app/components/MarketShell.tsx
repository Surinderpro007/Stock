import { cookies } from 'next/headers';
import Navbar from './Navbar';
import PublicHeader from './PublicHeader';

export default async function MarketShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get('token')?.value);

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col">
      {isLoggedIn ? <Navbar /> : <PublicHeader />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
