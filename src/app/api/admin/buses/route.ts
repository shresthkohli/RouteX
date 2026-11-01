import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { AdminBus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rows = await sql(
      `SELECT bus_id, bus_number, bus_type, capacity, status FROM buses ORDER BY bus_id ASC;`
    );

    const buses: AdminBus[] = rows.map((r: any) => ({
      bus_id: r.bus_id,
      bus_number: r.bus_number,
      bus_type: r.bus_type as 'Standard' | 'Articulated' | 'Mini' | 'Electric',
      capacity: Number(r.capacity),
      status: r.status as 'Active' | 'Maintenance' | 'Retired',
    }));

    return NextResponse.json({ buses });
  } catch (error: any) {
    console.error('Admin GET buses error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch buses' },
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
    const { bus_number, bus_type, capacity, status } = body;

    if (!bus_number || typeof bus_number !== 'string' || !bus_number.trim()) {
      return NextResponse.json({ error: 'Bus number is required' }, { status: 400 });
    }

    const validTypes = ['Standard', 'Articulated', 'Mini', 'Electric'];
    if (!bus_type || !validTypes.includes(bus_type)) {
      return NextResponse.json(
        { error: 'bus_type must be Standard, Articulated, Mini, or Electric' },
        { status: 400 }
      );
    }

    const cap = Number(capacity);
    if (isNaN(cap) || cap <= 0) {
      return NextResponse.json({ error: 'Capacity must be greater than 0' }, { status: 400 });
    }

    const validStatuses = ['Active', 'Maintenance', 'Retired'];
    const busStatus = status && validStatuses.includes(status) ? status : 'Active';

    const rows = await sql(
      `INSERT INTO buses (bus_number, bus_type, capacity, status)
       VALUES ($1, $2, $3, $4)
       RETURNING bus_id, bus_number, bus_type, capacity, status;`,
      [bus_number.trim().toUpperCase(), bus_type, cap, busStatus]
    );

    const bus: AdminBus = {
      bus_id: rows[0].bus_id,
      bus_number: rows[0].bus_number,
      bus_type: rows[0].bus_type as 'Standard' | 'Articulated' | 'Mini' | 'Electric',
      capacity: Number(rows[0].capacity),
      status: rows[0].status as 'Active' | 'Maintenance' | 'Retired',
    };

    return NextResponse.json({ bus }, { status: 201 });
  } catch (error: any) {
    console.error('Admin POST bus error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A bus with this number already exists' }, { status: 409 });
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create bus' },
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
    const { bus_id, bus_number, bus_type, capacity, status } = body;

    if (!bus_id || typeof bus_id !== 'number') {
      return NextResponse.json({ error: 'Valid bus_id is required' }, { status: 400 });
    }

    if (!bus_number || typeof bus_number !== 'string' || !bus_number.trim()) {
      return NextResponse.json({ error: 'Bus number is required' }, { status: 400 });
    }

    const validTypes = ['Standard', 'Articulated', 'Mini', 'Electric'];
    if (!bus_type || !validTypes.includes(bus_type)) {
      return NextResponse.json(
        { error: 'bus_type must be Standard, Articulated, Mini, or Electric' },
        { status: 400 }
      );
    }

    const cap = Number(capacity);
    if (isNaN(cap) || cap <= 0) {
      return NextResponse.json({ error: 'Capacity must be greater than 0' }, { status: 400 });
    }

    const validStatuses = ['Active', 'Maintenance', 'Retired'];
    const busStatus = status && validStatuses.includes(status) ? status : 'Active';

    const rows = await sql(
      `UPDATE buses
       SET bus_number = $2, bus_type = $3, capacity = $4, status = $5
       WHERE bus_id = $1
       RETURNING bus_id, bus_number, bus_type, capacity, status;`,
      [bus_id, bus_number.trim().toUpperCase(), bus_type, cap, busStatus]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    const bus: AdminBus = {
      bus_id: rows[0].bus_id,
      bus_number: rows[0].bus_number,
      bus_type: rows[0].bus_type as 'Standard' | 'Articulated' | 'Mini' | 'Electric',
      capacity: Number(rows[0].capacity),
      status: rows[0].status as 'Active' | 'Maintenance' | 'Retired',
    };

    return NextResponse.json({ bus }, { status: 200 });
  } catch (error: any) {
    console.error('Admin PUT bus error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A bus with this number already exists' }, { status: 409 });
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to update bus' },
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
    const busIdParam = searchParams.get('busId');

    if (!busIdParam) {
      return NextResponse.json({ error: 'busId query parameter is required' }, { status: 400 });
    }

    const bus_id = parseInt(busIdParam, 10);
    if (isNaN(bus_id)) {
      return NextResponse.json({ error: 'Invalid busId parameter' }, { status: 400 });
    }

    await sql(`DELETE FROM buses WHERE bus_id = $1;`, [bus_id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Admin DELETE bus error:', error);
    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete bus because it is currently assigned to one or more trips.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to delete bus' },
      { status: 500 }
    );
  }
}

