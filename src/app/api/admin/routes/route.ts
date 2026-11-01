import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { AdminRoute, AdminRouteStopInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const routesRows = await sql(
      `SELECT route_id, route_number, route_name, route_type, is_active
       FROM routes
       ORDER BY route_id ASC;`
    );

    const stopsRows = await sql(
      `SELECT rs.route_id, rs.stop_id, s.stop_name, rs.stop_sequence
       FROM route_stops rs
       JOIN stops s ON s.stop_id = rs.stop_id
       ORDER BY rs.route_id ASC, rs.stop_sequence ASC;`
    );

    const stopsByRoute: Record<number, { stop_id: number; stop_name: string; stop_sequence: number }[]> = {};
    for (const row of stopsRows) {
      if (!stopsByRoute[row.route_id]) {
        stopsByRoute[row.route_id] = [];
      }
      stopsByRoute[row.route_id].push({
        stop_id: row.stop_id,
        stop_name: row.stop_name,
        stop_sequence: row.stop_sequence,
      });
    }

    const routes: AdminRoute[] = routesRows.map((r: any) => ({
      route_id: r.route_id,
      route_number: r.route_number,
      route_name: r.route_name,
      route_type: r.route_type as 'City Bus' | 'BRTS' | 'Electric',
      is_active: Boolean(r.is_active),
      stops: stopsByRoute[r.route_id] || [],
    }));

    return NextResponse.json({ routes });
  } catch (error: any) {
    console.error('Admin GET routes error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch routes' },
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
    const { route_number, route_name, route_type, is_active, stops } = body;

    if (!route_number || typeof route_number !== 'string' || !route_number.trim()) {
      return NextResponse.json({ error: 'Route number is required' }, { status: 400 });
    }

    if (!route_name || typeof route_name !== 'string' || !route_name.trim()) {
      return NextResponse.json({ error: 'Route name is required' }, { status: 400 });
    }

    const validTypes = ['City Bus', 'BRTS', 'Electric'];
    if (!route_type || !validTypes.includes(route_type)) {
      return NextResponse.json(
        { error: 'route_type must be City Bus, BRTS, or Electric' },
        { status: 400 }
      );
    }

    const active = is_active !== undefined ? Boolean(is_active) : true;

    // Insert Route
    const inserted = await sql(
      `INSERT INTO routes (route_number, route_name, route_type, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING route_id, route_number, route_name, route_type, is_active;`,
      [route_number.trim(), route_name.trim(), route_type, active]
    );

    const newRouteId = inserted[0].route_id;

    // Handle stops sequence
    const insertedStops: { stop_id: number; stop_name: string; stop_sequence: number }[] = [];
    if (Array.isArray(stops) && stops.length > 0) {
      const seenStops = new Set<number>();
      for (let i = 0; i < stops.length; i++) {
        const item: AdminRouteStopInput = stops[i];
        if (seenStops.has(item.stop_id)) {
          continue; // Prevent duplicate stop on same route
        }
        seenStops.add(item.stop_id);
        const seq = i + 1;
        await sql(
          `INSERT INTO route_stops (route_id, stop_id, stop_sequence)
           VALUES ($1, $2, $3);`,
          [newRouteId, item.stop_id, seq]
        );
      }

      const freshStops = await sql(
        `SELECT rs.stop_id, s.stop_name, rs.stop_sequence
         FROM route_stops rs
         JOIN stops s ON s.stop_id = rs.stop_id
         WHERE rs.route_id = $1
         ORDER BY rs.stop_sequence ASC;`,
        [newRouteId]
      );
      freshStops.forEach((s: any) => {
        insertedStops.push({
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          stop_sequence: s.stop_sequence,
        });
      });
    }

    const route: AdminRoute = {
      route_id: inserted[0].route_id,
      route_number: inserted[0].route_number,
      route_name: inserted[0].route_name,
      route_type: inserted[0].route_type as 'City Bus' | 'BRTS' | 'Electric',
      is_active: Boolean(inserted[0].is_active),
      stops: insertedStops,
    };

    return NextResponse.json({ route }, { status: 201 });
  } catch (error: any) {
    console.error('Admin POST route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create route' },
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
    const { route_id, route_number, route_name, route_type, is_active, stops } = body;

    if (!route_id || typeof route_id !== 'number') {
      return NextResponse.json({ error: 'Valid route_id is required' }, { status: 400 });
    }

    if (!route_number || typeof route_number !== 'string' || !route_number.trim()) {
      return NextResponse.json({ error: 'Route number is required' }, { status: 400 });
    }

    if (!route_name || typeof route_name !== 'string' || !route_name.trim()) {
      return NextResponse.json({ error: 'Route name is required' }, { status: 400 });
    }

    const validTypes = ['City Bus', 'BRTS', 'Electric'];
    if (!route_type || !validTypes.includes(route_type)) {
      return NextResponse.json(
        { error: 'route_type must be City Bus, BRTS, or Electric' },
        { status: 400 }
      );
    }

    const active = is_active !== undefined ? Boolean(is_active) : true;

    const updated = await sql(
      `UPDATE routes
       SET route_number = $2, route_name = $3, route_type = $4, is_active = $5
       WHERE route_id = $1
       RETURNING route_id, route_number, route_name, route_type, is_active;`,
      [route_id, route_number.trim(), route_name.trim(), route_type, active]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Replace stop sequence if stops array is provided
    const freshStopsList: { stop_id: number; stop_name: string; stop_sequence: number }[] = [];
    if (Array.isArray(stops)) {
      await sql(`DELETE FROM route_stops WHERE route_id = $1;`, [route_id]);
      const seenStops = new Set<number>();
      for (let i = 0; i < stops.length; i++) {
        const item: AdminRouteStopInput = stops[i];
        if (seenStops.has(item.stop_id)) continue;
        seenStops.add(item.stop_id);
        const seq = i + 1;
        await sql(
          `INSERT INTO route_stops (route_id, stop_id, stop_sequence)
           VALUES ($1, $2, $3);`,
          [route_id, item.stop_id, seq]
        );
      }

      const freshStops = await sql(
        `SELECT rs.stop_id, s.stop_name, rs.stop_sequence
         FROM route_stops rs
         JOIN stops s ON s.stop_id = rs.stop_id
         WHERE rs.route_id = $1
         ORDER BY rs.stop_sequence ASC;`,
        [route_id]
      );
      freshStops.forEach((s: any) => {
        freshStopsList.push({
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          stop_sequence: s.stop_sequence,
        });
      });
    }

    const route: AdminRoute = {
      route_id: updated[0].route_id,
      route_number: updated[0].route_number,
      route_name: updated[0].route_name,
      route_type: updated[0].route_type as 'City Bus' | 'BRTS' | 'Electric',
      is_active: Boolean(updated[0].is_active),
      stops: freshStopsList,
    };

    return NextResponse.json({ route }, { status: 200 });
  } catch (error: any) {
    console.error('Admin PUT route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update route' },
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
    const routeIdParam = searchParams.get('routeId');

    if (!routeIdParam) {
      return NextResponse.json({ error: 'routeId query parameter is required' }, { status: 400 });
    }

    const route_id = parseInt(routeIdParam, 10);
    if (isNaN(route_id)) {
      return NextResponse.json({ error: 'Invalid routeId parameter' }, { status: 400 });
    }

    // Attempt stored procedure call or standard cascade
    try {
      await sql(`CALL sp_delete_route($1::INT);`, [route_id]);
    } catch {
      await sql(`DELETE FROM route_stops WHERE route_id = $1;`, [route_id]);
      await sql(`DELETE FROM routes WHERE route_id = $1;`, [route_id]);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Admin DELETE route error:', error);
    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete route because it is referenced by trips or user favorites.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to delete route' },
      { status: 500 }
    );
  }
}

