import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '../../../controllers/authController';
const { registerSchema, formatZodError } = require('../../../lib/validation');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const user = await registerUser(parsed.data);

    return NextResponse.json({ message: 'Registration successful', user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 400 });
  }
}