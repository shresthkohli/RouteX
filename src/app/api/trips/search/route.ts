import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { BusServiceResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromStopIdParam = searchParams.get('fromStopId');
    const toStopIdParam = searchParams.get('toStopId');
    const departureAfter = searchParams.get('departureAfter');
    const dayOfWeekParam = searchParams.get('dayOfWeek');

    if (!fromStopIdParam || !toStopIdParam) {
      return NextResponse.json(
        { error: 'Both fromStopId and toStopId are required' },
        { status: 400 }
      );
    }

    const fromStopId = parseInt(fromStopIdParam, 10);
    const toStopId = parseInt(toStopIdParam, 10);

    if (isNaN(fromStopId) || isNaN(toStopId)) {
      return NextResponse.json(
        { error: 'Invalid station identifier' },
        { status: 400 }
      );
    }

    let rows: any[] = [];

    if (departureAfter && dayOfWeekParam) {
      const dayOfWeek = parseInt(dayOfWeekParam, 10);
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        return NextResponse.json(
          { error: 'dayOfWeek must be an integer between 1 (Mon) and 7 (Sun)' },
          { status: 400 }
        );
      }

      rows = await sql(
        `SELECT * FROM search_bus_services($1::INT, $2::INT, $3::TIME, $4::INT);`,
        [fromStopId, toStopId, departureAfter, dayOfWeek]
      );
    } else {
      rows = await sql(
        `SELECT * FROM search_bus_services($1::INT, $2::INT);`,
        [fromStopId, toStopId]
      );
    }

    const trips = rows as BusServiceResult[];
    return NextResponse.json({ trips });
  } catch (error: any) {
    console.error('Trips search error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to search trips' },
      { status: 500 }
    );
  }
}
