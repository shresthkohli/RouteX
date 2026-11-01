import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { AdminStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rows = await sql(`
      SELECT
        (SELECT COUNT(*)::INT FROM stops) AS total_stops,
        (SELECT COUNT(*)::INT FROM stops WHERE is_active = TRUE) AS active_stops,
        (SELECT COUNT(*)::INT FROM routes) AS total_routes,
        (SELECT COUNT(*)::INT FROM routes WHERE is_active = TRUE) AS active_routes,
        (SELECT COUNT(*)::INT FROM buses) AS total_buses,
        (SELECT COUNT(*)::INT FROM buses WHERE status = 'Active') AS active_buses,
        (SELECT COUNT(*)::INT FROM schedules) AS total_schedules,
        (SELECT COUNT(*)::INT FROM trips) AS total_trips,
        (SELECT COUNT(*)::INT FROM trips WHERE status = 'Scheduled') AS scheduled_trips,
        (SELECT COUNT(*)::INT FROM users) AS total_users;
    `);

    const stats: AdminStats = {
      total_stops: Number(rows[0]?.total_stops ?? 0),
      active_stops: Number(rows[0]?.active_stops ?? 0),
      total_routes: Number(rows[0]?.total_routes ?? 0),
      active_routes: Number(rows[0]?.active_routes ?? 0),
      total_buses: Number(rows[0]?.total_buses ?? 0),
      active_buses: Number(rows[0]?.active_buses ?? 0),
      total_schedules: Number(rows[0]?.total_schedules ?? 0),
      total_trips: Number(rows[0]?.total_trips ?? 0),
      scheduled_trips: Number(rows[0]?.scheduled_trips ?? 0),
      total_users: Number(rows[0]?.total_users ?? 0),
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
