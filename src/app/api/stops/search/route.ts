import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { StopOption } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    let stops: StopOption[] = [];

    if (!q || q.trim() === '') {
      const rows = await sql(
        `SELECT stop_id, stop_name FROM stops WHERE is_active = TRUE ORDER BY stop_name LIMIT 10;`
      );
      stops = rows as StopOption[];
    } else {
      const rows = await sql(
        `SELECT * FROM search_stops($1::TEXT);`,
        [q.trim()]
      );
      stops = rows as StopOption[];
    }

    return NextResponse.json({ stops });
  } catch (error: any) {
    console.error('Stops search error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to search stops' },
      { status: 500 }
    );
  }
}
