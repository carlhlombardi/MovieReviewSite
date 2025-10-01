import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET /api/data/[genre]?url=some-url
export async function GET(req, { params }) {
  const genreSegment = params.genre;
  const tableName = genreSegment.toLowerCase();

  try {
    const urlParam = new URL(req.url).searchParams.get('url');

    if (urlParam) {
      const result = await sql`
        SELECT * FROM ${sql(tableName)} WHERE url = ${urlParam};
      `;
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }
      return NextResponse.json(result.rows[0]);
    } else {
      const result = await sql`SELECT * FROM ${sql(tableName)};`;
      return NextResponse.json(result.rows);
    }
  } catch (error) {
    console.error('GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST /api/data/[genre]
export async function POST(req, { params }) {
  const genreSegment = params.genre;
  const tableName = genreSegment.toLowerCase();

  try {
    const {
      title,
      year,
      director,
      screenwriters,
      producers,
      studios,
      run_time,
      url,
    } = await req.json();

    if (!title || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if table exists
    try {
      await sql`SELECT 1 FROM ${sql(tableName)} LIMIT 1;`;
    } catch {
      return NextResponse.json({ error: `Table '${tableName}' does not exist.` }, { status: 400 });
    }

    const existing = await sql`
      SELECT * FROM ${sql(tableName)} WHERE film = ${title};
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Movie already exists' }, { status: 200 });
    }

    await sql`
      INSERT INTO ${sql(tableName)}
        (film, year, studio, director, screenwriters, producer, run_time, url)
      VALUES
        (${title}, ${year}, ${studios}, ${director}, ${screenwriters}, ${producers}, ${run_time}, ${url});
    `;

    return NextResponse.json({ message: 'Movie inserted successfully' }, { status: 201 });

  } catch (error) {
    console.error('POST failed:', error);
    return NextResponse.json({ error: 'Failed to insert movie' }, { status: 500 });
  }
}
