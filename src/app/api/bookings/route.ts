import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { PassengerBooking } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql(
      `SELECT * FROM fn_get_passenger_bookings($1::INT);`,
      [session.passenger_id]
    );

    const bookings = rows as PassengerBooking[];
    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trip_id } = body;

    if (!trip_id || typeof trip_id !== 'number') {
      return NextResponse.json({ error: 'Valid trip_id is required' }, { status: 400 });
    }

    const rows = await sql(
      `SELECT * FROM fn_book_trip($1::INT, $2::INT);`,
      [session.passenger_id, trip_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Unable to book trip' }, { status: 400 });
    }

    const booking = rows[0];
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error('Book trip error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to book trip' },
      { status: 500 }
    );
  }
}
