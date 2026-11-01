import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { AdminTrip } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rows = await sql(
      `SELECT
        t.trip_id,
        t.route_id,
        r.route_number,
        r.route_name,
        t.bus_id,
        b.bus_number,
        t.schedule_id,
        s.schedule_name,
        t.departure_time,
        t.arrival_time,
        t.fare,
        t.status
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN schedules s ON t.schedule_id = s.schedule_id
      LEFT JOIN buses b ON t.bus_id = b.bus_id
      ORDER BY t.departure_time ASC, t.trip_id ASC;`
    );

    const trips: AdminTrip[] = rows.map((r: any) => ({
      trip_id: r.trip_id,
      route_id: r.route_id,
      route_number: r.route_number,
      route_name: r.route_name,
      bus_id: r.bus_id ? Number(r.bus_id) : null,
      bus_number: r.bus_number || null,
      schedule_id: r.schedule_id,
      schedule_name: r.schedule_name,
      departure_time: String(r.departure_time),
      arrival_time: String(r.arrival_time),
      fare: String(r.fare),
      status: r.status as 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
    }));

    return NextResponse.json({ trips });
  } catch (error: any) {
    console.error('Admin GET trips error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { route_id, bus_id, schedule_id, departure_time, arrival_time, fare, status } = body;

    if (!route_id || typeof route_id !== 'number') {
      return NextResponse.json({ error: 'Valid route_id is required' }, { status: 400 });
    }

    if (!schedule_id || typeof schedule_id !== 'number') {
      return NextResponse.json({ error: 'Valid schedule_id is required' }, { status: 400 });
    }

    if (!departure_time || !arrival_time) {
      return NextResponse.json(
        { error: 'Both departure_time and arrival_time are required' },
        { status: 400 }
      );
    }

    if (arrival_time <= departure_time) {
      return NextResponse.json(
        { error: 'arrival_time must be later than departure_time' },
        { status: 400 }
      );
    }

    const numericFare = Number(fare);
    if (isNaN(numericFare) || numericFare < 0) {
      return NextResponse.json(
        { error: 'fare must be a non-negative number' },
        { status: 400 }
      );
    }

    const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
    const tripStatus = status && validStatuses.includes(status) ? status : 'Scheduled';
    const busId = bus_id ? Number(bus_id) : null;

    const inserted = await sql(
      `INSERT INTO trips (route_id, bus_id, schedule_id, departure_time, arrival_time, fare, status)
       VALUES ($1, $2, $3, $4::TIME, $5::TIME, $6, $7)
       RETURNING *;`,
      [route_id, busId, schedule_id, departure_time, arrival_time, numericFare, tripStatus]
    );

    const tripId = inserted[0].trip_id;

    // Fetch complete trip with joined route, bus, schedule
    const rows = await sql(
      `SELECT
        t.trip_id,
        t.route_id,
        r.route_number,
        r.route_name,
        t.bus_id,
        b.bus_number,
        t.schedule_id,
        s.schedule_name,
        t.departure_time,
        t.arrival_time,
        t.fare,
        t.status
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN schedules s ON t.schedule_id = s.schedule_id
      LEFT JOIN buses b ON t.bus_id = b.bus_id
      WHERE t.trip_id = $1;`,
      [tripId]
    );

    const trip: AdminTrip = {
      trip_id: rows[0].trip_id,
      route_id: rows[0].route_id,
      route_number: rows[0].route_number,
      route_name: rows[0].route_name,
      bus_id: rows[0].bus_id ? Number(rows[0].bus_id) : null,
      bus_number: rows[0].bus_number || null,
      schedule_id: rows[0].schedule_id,
      schedule_name: rows[0].schedule_name,
      departure_time: String(rows[0].departure_time),
      arrival_time: String(rows[0].arrival_time),
      fare: String(rows[0].fare),
      status: rows[0].status as 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
    };

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error: any) {
    console.error('Admin POST trip error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create trip' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { trip_id, route_id, bus_id, schedule_id, departure_time, arrival_time, fare, status } = body;

    if (!trip_id || typeof trip_id !== 'number') {
      return NextResponse.json({ error: 'Valid trip_id is required' }, { status: 400 });
    }

    if (!route_id || typeof route_id !== 'number') {
      return NextResponse.json({ error: 'Valid route_id is required' }, { status: 400 });
    }

    if (!schedule_id || typeof schedule_id !== 'number') {
      return NextResponse.json({ error: 'Valid schedule_id is required' }, { status: 400 });
    }

    if (!departure_time || !arrival_time) {
      return NextResponse.json(
        { error: 'Both departure_time and arrival_time are required' },
        { status: 400 }
      );
    }

    if (arrival_time <= departure_time) {
      return NextResponse.json(
        { error: 'arrival_time must be later than departure_time' },
        { status: 400 }
      );
    }

    const numericFare = Number(fare);
    if (isNaN(numericFare) || numericFare < 0) {
      return NextResponse.json(
        { error: 'fare must be a non-negative number' },
        { status: 400 }
      );
    }

    const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
    const tripStatus = status && validStatuses.includes(status) ? status : 'Scheduled';
    const busId = bus_id ? Number(bus_id) : null;

    const updated = await sql(
      `UPDATE trips
       SET route_id = $2, bus_id = $3, schedule_id = $4, departure_time = $5::TIME, arrival_time = $6::TIME, fare = $7, status = $8
       WHERE trip_id = $1
       RETURNING *;`,
      [trip_id, route_id, busId, schedule_id, departure_time, arrival_time, numericFare, tripStatus]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const rows = await sql(
      `SELECT
        t.trip_id,
        t.route_id,
        r.route_number,
        r.route_name,
        t.bus_id,
        b.bus_number,
        t.schedule_id,
        s.schedule_name,
        t.departure_time,
        t.arrival_time,
        t.fare,
        t.status
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN schedules s ON t.schedule_id = s.schedule_id
      LEFT JOIN buses b ON t.bus_id = b.bus_id
      WHERE t.trip_id = $1;`,
      [trip_id]
    );

    const trip: AdminTrip = {
      trip_id: rows[0].trip_id,
      route_id: rows[0].route_id,
      route_number: rows[0].route_number,
      route_name: rows[0].route_name,
      bus_id: rows[0].bus_id ? Number(rows[0].bus_id) : null,
      bus_number: rows[0].bus_number || null,
      schedule_id: rows[0].schedule_id,
      schedule_name: rows[0].schedule_name,
      departure_time: String(rows[0].departure_time),
      arrival_time: String(rows[0].arrival_time),
      fare: String(rows[0].fare),
      status: rows[0].status as 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
    };

    return NextResponse.json({ trip }, { status: 200 });
  } catch (error: any) {
    console.error('Admin PUT trip error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update trip' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tripIdParam = searchParams.get('tripId');

    if (!tripIdParam) {
      return NextResponse.json({ error: 'tripId query parameter is required' }, { status: 400 });
    }

    const trip_id = parseInt(tripIdParam, 10);
    if (isNaN(trip_id)) {
      return NextResponse.json({ error: 'Invalid tripId parameter' }, { status: 400 });
    }

    await sql(`DELETE FROM trips WHERE trip_id = $1;`, [trip_id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Admin DELETE trip error:', error);
    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete trip because tickets have already been booked for it.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to delete trip' },
      { status: 500 }
    );
  }
}

