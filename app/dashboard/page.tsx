// app/dashboard/page.tsx

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Navbar from '../components/Navbar';

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
    <div className="min-h-screen bg-[#F7F5EF]">
      <Navbar />

      <div className="flex items-center justify-center px-6 py-24">
        <div className="max-w-md w-full text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-4 uppercase">
            Dashboard
          </p>
          <h1 className="font-serif text-4xl text-[#14140F] mb-2">
            Welcome {decoded.name}!
          </h1>
          <p className="text-[#6B6858] text-sm">{decoded.email}</p>
        </div>
      </div>
    </div>
  );
}