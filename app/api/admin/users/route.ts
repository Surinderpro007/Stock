import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getAllUsers } from '../../../../controllers/adminController';
import connectDB from '../../../../config/db';
const User = require('../../../../models/User');

interface DecodedToken {
  id: string;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

    await connectDB();
    const currentUser = await User.findById(decoded.id);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sortBy = searchParams.get('sortBy') || 'joined';
    const status = searchParams.get('status') || 'active'; // 'active' | 'deleted'

    const result = await getAllUsers({ search, page, limit: 15, sortBy, status });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 400 });
  }
}