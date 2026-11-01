import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { AdminSchedule } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rows = await sql(
      `SELECT schedule_id, schedule_name, monday, tuesday, wednesday, thursday, friday, saturday, sunday
       FROM schedules
       ORDER BY schedule_id ASC;`
    );

    const schedules: AdminSchedule[] = rows.map((r: any) => ({
      schedule_id: r.schedule_id,
      schedule_name: r.schedule_name,
      monday: Boolean(r.monday),
      tuesday: Boolean(r.tuesday),
      wednesday: Boolean(r.wednesday),
      thursday: Boolean(r.thursday),
      friday: Boolean(r.friday),
      saturday: Boolean(r.saturday),
      sunday: Boolean(r.sunday),
    }));

    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Admin GET schedules error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch schedules' },
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
    const { schedule_name, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = body;

    if (!schedule_name || typeof schedule_name !== 'string' || !schedule_name.trim()) {
      return NextResponse.json({ error: 'Schedule name is required' }, { status: 400 });
    }

    const rows = await sql(
      `INSERT INTO schedules (schedule_name, monday, tuesday, wednesday, thursday, friday, saturday, sunday)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING schedule_id, schedule_name, monday, tuesday, wednesday, thursday, friday, saturday, sunday;`,
      [
        schedule_name.trim(),
        Boolean(monday),
        Boolean(tuesday),
        Boolean(wednesday),
        Boolean(thursday),
        Boolean(friday),
        Boolean(saturday),
        Boolean(sunday),
      ]
    );

    const schedule: AdminSchedule = {
      schedule_id: rows[0].schedule_id,
      schedule_name: rows[0].schedule_name,
      monday: Boolean(rows[0].monday),
      tuesday: Boolean(rows[0].tuesday),
      wednesday: Boolean(rows[0].wednesday),
      thursday: Boolean(rows[0].thursday),
      friday: Boolean(rows[0].friday),
      saturday: Boolean(rows[0].saturday),
      sunday: Boolean(rows[0].sunday),
    };

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    console.error('Admin POST schedule error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create schedule' },
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
    const { schedule_id, schedule_name, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = body;

    if (!schedule_id || typeof schedule_id !== 'number') {
      return NextResponse.json({ error: 'Valid schedule_id is required' }, { status: 400 });
    }

    if (!schedule_name || typeof schedule_name !== 'string' || !schedule_name.trim()) {
      return NextResponse.json({ error: 'Schedule name is required' }, { status: 400 });
    }

    const rows = await sql(
      `UPDATE schedules
       SET schedule_name = $2, monday = $3, tuesday = $4, wednesday = $5, thursday = $6, friday = $7, saturday = $8, sunday = $9
       WHERE schedule_id = $1
       RETURNING schedule_id, schedule_name, monday, tuesday, wednesday, thursday, friday, saturday, sunday;`,
      [
        schedule_id,
        schedule_name.trim(),
        Boolean(monday),
        Boolean(tuesday),
        Boolean(wednesday),
        Boolean(thursday),
        Boolean(friday),
        Boolean(saturday),
        Boolean(sunday),
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const schedule: AdminSchedule = {
      schedule_id: rows[0].schedule_id,
      schedule_name: rows[0].schedule_name,
      monday: Boolean(rows[0].monday),
      tuesday: Boolean(rows[0].tuesday),
      wednesday: Boolean(rows[0].wednesday),
      thursday: Boolean(rows[0].thursday),
      friday: Boolean(rows[0].friday),
      saturday: Boolean(rows[0].saturday),
      sunday: Boolean(rows[0].sunday),
    };

    return NextResponse.json({ schedule }, { status: 200 });
  } catch (error: any) {
    console.error('Admin PUT schedule error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update schedule' },
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
    const scheduleIdParam = searchParams.get('scheduleId');

    if (!scheduleIdParam) {
      return NextResponse.json({ error: 'scheduleId query parameter is required' }, { status: 400 });
    }

    const schedule_id = parseInt(scheduleIdParam, 10);
    if (isNaN(schedule_id)) {
      return NextResponse.json({ error: 'Invalid scheduleId parameter' }, { status: 400 });
    }

    await sql(`DELETE FROM schedules WHERE schedule_id = $1;`, [schedule_id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Admin DELETE schedule error:', error);
    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete schedule because it is currently assigned to one or more trips.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}

