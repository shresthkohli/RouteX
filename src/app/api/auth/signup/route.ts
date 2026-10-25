import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone_number, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const trimmedEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
    const trimmedPhone = phone_number && typeof phone_number === 'string' && phone_number.trim() ? phone_number.trim() : null;

    if (!trimmedEmail && !trimmedPhone) {
      return NextResponse.json(
        { error: 'At least one of email or phone number is required' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql(
      `INSERT INTO users (name, email, phone_number, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING passenger_id, name, user_role;`,
      [name.trim(), trimmedEmail, trimmedPhone, passwordHash]
    );

    const user = result[0] as { passenger_id: number; name: string; user_role: 'passenger' | 'admin' };

    await createSessionCookie({
      passenger_id: user.passenger_id,
      name: user.name,
      user_role: user.user_role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists' },
        { status: 409 }
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to register account' },
      { status: 500 }
    );
  }
}
