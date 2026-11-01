import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { AdminStop } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rows = await sql(
      `SELECT stop_id, stop_name, latitude, longitude, is_active FROM stops ORDER BY stop_id ASC;`
    );

    const stops: AdminStop[] = rows.map((r: any) => ({
      stop_id: r.stop_id,
      stop_name: r.stop_name,
      latitude: r.latitude !== null ? String(r.latitude) : null,
      longitude: r.longitude !== null ? String(r.longitude) : null,
      is_active: Boolean(r.is_active),
    }));

    return NextResponse.json({ stops });
  } catch (error: any) {
    console.error('Admin GET stops error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch stops' },
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
    const { stop_name, latitude, longitude, is_active } = body;

    if (!stop_name || typeof stop_name !== 'string' || !stop_name.trim()) {
      return NextResponse.json({ error: 'Stop name is required' }, { status: 400 });
    }

    const active = is_active !== undefined ? Boolean(is_active) : true;
    const lat = latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : null;
    const lng = longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : null;

    const rows = await sql(
      `INSERT INTO stops (stop_name, latitude, longitude, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING stop_id, stop_name, latitude, longitude, is_active;`,
      [stop_name.trim(), lat, lng, active]
    );

    const stop: AdminStop = {
      stop_id: rows[0].stop_id,
      stop_name: rows[0].stop_name,
      latitude: rows[0].latitude !== null ? String(rows[0].latitude) : null,
      longitude: rows[0].longitude !== null ? String(rows[0].longitude) : null,
      is_active: Boolean(rows[0].is_active),
    };

    return NextResponse.json({ stop }, { status: 201 });
  } catch (error: any) {
    console.error('Admin POST stop error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create stop' },
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
    const { stop_id, stop_name, latitude, longitude, is_active } = body;

    if (!stop_id || typeof stop_id !== 'number') {
      return NextResponse.json({ error: 'Valid stop_id is required' }, { status: 400 });
    }

    if (!stop_name || typeof stop_name !== 'string' || !stop_name.trim()) {
      return NextResponse.json({ error: 'Stop name is required' }, { status: 400 });
    }

    const active = is_active !== undefined ? Boolean(is_active) : true;
    const lat = latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : null;
    const lng = longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : null;

    const rows = await sql(
      `UPDATE stops
       SET stop_name = $2, latitude = $3, longitude = $4, is_active = $5
       WHERE stop_id = $1
       RETURNING stop_id, stop_name, latitude, longitude, is_active;`,
      [stop_id, stop_name.trim(), lat, lng, active]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
    }

    const stop: AdminStop = {
      stop_id: rows[0].stop_id,
      stop_name: rows[0].stop_name,
      latitude: rows[0].latitude !== null ? String(rows[0].latitude) : null,
      longitude: rows[0].longitude !== null ? String(rows[0].longitude) : null,
      is_active: Boolean(rows[0].is_active),
    };

    return NextResponse.json({ stop }, { status: 200 });
  } catch (error: any) {
    console.error('Admin PUT stop error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update stop' },
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
    const stopIdParam = searchParams.get('stopId');

    if (!stopIdParam) {
      return NextResponse.json({ error: 'stopId query parameter is required' }, { status: 400 });
    }

    const stop_id = parseInt(stopIdParam, 10);
    if (isNaN(stop_id)) {
      return NextResponse.json({ error: 'Invalid stopId parameter' }, { status: 400 });
    }

    await sql(`DELETE FROM stops WHERE stop_id = $1;`, [stop_id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Admin DELETE stop error:', error);
    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete stop because it is currently assigned to one or more routes.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to delete stop' },
      { status: 500 }
    );
  }
}

