import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { UserProfile } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql(
      `SELECT * FROM fn_get_user_profile($1::INT);`,
      [session.passenger_id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const user = result[0] as UserProfile;
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve user profile' },
      { status: 500 }
    );
  }
}
