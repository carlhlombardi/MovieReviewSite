import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req, { params }) {
  try {
    const genreSegment = params.genre; // e.g. 'comedymovies'
    if (!genreSegment || !genreSegment.endsWith('movies')) {
      return NextResponse.json({ error: 'Invalid genre in URL' }, { status: 400 });
    }

    const genre = genreSegment.replace(/movies$/, ''); // e.g. 'comedy'
    const tableName = genreSegment.toLowerCase(); // e.g. 'comedymovies'

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

    // Basic validation
    if (!title || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if table exists (optional)
    try {
      await sql`SELECT 1 FROM ${sql(tableName)} LIMIT 1;`;
    } catch {
      return NextResponse.json({ error: `Table '${tableName}' does not exist.` }, { status: 400 });
    }

    // Check duplicates
    const existing = await sql`
      SELECT * FROM ${sql(tableName)} WHERE film = ${title}
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Movie already exists' }, { status: 200 });
    }

    // Insert movie
    await sql`
      INSERT INTO ${sql(tableName)} 
        (film, year, studio, director, screenwriters, producer, run_time, url)
      VALUES 
        (${title}, ${year}, ${studios}, ${director}, ${screenwriters}, ${producers}, ${run_time}, ${url})
    `;

    return NextResponse.json({ message: 'Movie inserted successfully' }, { status: 201 });

  } catch (error) {
    console.error('Insert failed:', error);
    return NextResponse.json({ error: 'Failed to insert movie' }, { status: 500 });
  }
}
