import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { BusRouteOverview, RouteStopItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const routeType = searchParams.get('routeType');

    let baseQuery = `
      SELECT route_id, route_number, route_name, route_type, is_active
      FROM routes
      WHERE is_active = TRUE
    `;
    const params: any[] = [];

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      baseQuery += ` AND (route_number ILIKE $${params.length} OR route_name ILIKE $${params.length})`;
    }

    if (routeType && routeType.trim() && routeType !== 'All') {
      params.push(routeType.trim());
      baseQuery += ` AND route_type = $${params.length}`;
    }

    baseQuery += ` ORDER BY route_number ASC LIMIT 50;`;

    const routesRows = await sql(baseQuery, params);

    const routesWithStops: BusRouteOverview[] = await Promise.all(
      routesRows.map(async (route: any) => {
        try {
          const stopsRows = await sql(
            `SELECT * FROM fn_get_route_stops_cursor($1::INT);`,
            [route.route_id]
          );
          return {
            route_id: route.route_id,
            route_number: route.route_number,
            route_name: route.route_name,
            route_type: route.route_type as 'City Bus' | 'BRTS' | 'Electric',
            is_active: Boolean(route.is_active),
            stops: stopsRows as RouteStopItem[],
          };
        } catch (stopErr) {
          console.error(`Error fetching stops for route ${route.route_id}:`, stopErr);
          return {
            route_id: route.route_id,
            route_number: route.route_number,
            route_name: route.route_name,
            route_type: route.route_type as 'City Bus' | 'BRTS' | 'Electric',
            is_active: Boolean(route.is_active),
            stops: [],
          };
        }
      })
    );

    return NextResponse.json({ routes: routesWithStops });
  } catch (error: any) {
    console.error('Buses search error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch buses' },
      { status: 500 }
    );
  }
}
