// app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  getUserById,
  updateUserRole,
  toggleSuspendUser,
  toggleDeactivateUser,
  requestUserDeletion,
  restoreDeletedUser,
  deleteUserByAdmin,
} from '../../../../../controllers/adminController';
import connectDB from '../../../../../config/db';
const User = require('../../../../../models/User');

interface DecodedToken {
  id: string;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

  await connectDB();
  const currentUser = await User.findById(decoded.id);

  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }

  return currentUser;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await getUserById(id);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    const status = error.message === 'UNAUTHORIZED' ? 401 : error.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    if (body.role !== undefined) {
      const result = await updateUserRole(admin, id, body.role);
      return NextResponse.json(result, { status: 200 });
    }

        if (body.suspend !== undefined) {
      const result = await toggleSuspendUser(admin, id, Boolean(body.suspend));
      return NextResponse.json(result, { status: 200 });
    }

    if (body.deactivate !== undefined) {
      const result = await toggleDeactivateUser(admin, id, Boolean(body.deactivate));
      return NextResponse.json(result, { status: 200 });
    }
     if (body.restore !== undefined) {
      const result = await restoreDeletedUser(admin, id);
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (error: any) {
    const status = error.message === 'UNAUTHORIZED' ? 401 : error.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const permanent = req.nextUrl.searchParams.get('permanent') === 'true';

    // Default = soft delete (moves to the "Deleted" tab). ?permanent=true = irreversible.
    const result = permanent
      ? await deleteUserByAdmin(admin, id)
      : await requestUserDeletion(admin, id);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const status = error.message === 'UNAUTHORIZED' ? 401 : error.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}