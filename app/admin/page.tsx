// app/admin/page.tsx

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import Navbar from '../components/Navbar';
import AdminTabs from './AdminTabs';
import connectDB from '../../config/db';

const User = require('../../models/User');

interface DecodedToken {
  id: string;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as DecodedToken;

  await connectDB();
  const currentUser = await User.findById(decoded.id);

  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
          Admin
        </p>
        <h1 className="font-serif text-3xl text-[#14140F] mb-8">
          Admin Panel
        </h1>
        <AdminTabs />
      </div>
    </div>
  );
}   