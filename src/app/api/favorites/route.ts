import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { FavoriteRoute } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql(
      `SELECT * FROM fn_get_favorite_routes($1::INT);`,
      [session.passenger_id]
    );

    const favorites = rows as FavoriteRoute[];
    return NextResponse.json({ favorites });
  } catch (error: any) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve favorite routes' },
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
    const { route_id } = body;

    if (!route_id || typeof route_id !== 'number') {
      return NextResponse.json({ error: 'Valid route_id is required' }, { status: 400 });
    }

    const rows = await sql(
      `SELECT fn_add_favorite_route($1::INT, $2::INT) AS favorite_id;`,
      [session.passenger_id, route_id]
    );

    const favorite_id = rows[0]?.favorite_id;
    return NextResponse.json({ favorite_id }, { status: 200 });
  } catch (error: any) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save favorite route' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let routeIdParam = searchParams.get('routeId');

    if (!routeIdParam) {
      try {
        const body = await request.json();
        if (body.route_id || body.routeId) {
          routeIdParam = String(body.route_id || body.routeId);
        }
      } catch {
        // no body
      }
    }

    if (!routeIdParam) {
      return NextResponse.json({ error: 'routeId query parameter is required' }, { status: 400 });
    }

    const routeId = parseInt(routeIdParam, 10);
    if (isNaN(routeId)) {
      return NextResponse.json({ error: 'Invalid routeId parameter' }, { status: 400 });
    }

    await sql(
      `DELETE FROM favorite_trips WHERE passenger_id = $1 AND route_id = $2;`,
      [session.passenger_id, routeId]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Delete favorite error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete favorite route' },
      { status: 500 }
    );
  }
}
