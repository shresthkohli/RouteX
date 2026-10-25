import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    const result = await sql(
      `SELECT passenger_id, name, email, phone_number, password_hash, user_role
       FROM users
       WHERE email = LOWER(TRIM($1)) OR phone_number = TRIM($1)
       LIMIT 1;`,
      [cleanIdentifier]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }

    const user = result[0] as {
      passenger_id: number;
      name: string;
      email: string | null;
      phone_number: string | null;
      password_hash: string;
      user_role: 'passenger' | 'admin';
    };

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }

    await createSessionCookie({
      passenger_id: user.passenger_id,
      name: user.name,
      user_role: user.user_role,
    });

    return NextResponse.json({
      user: {
        passenger_id: user.passenger_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        user_role: user.user_role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to authenticate user' },
      { status: 500 }
    );
  }
}
