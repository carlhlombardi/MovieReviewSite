export async function POST(req, { params }) {
  const genreSegment = params.genre.toLowerCase();

  if (!allowedTables.includes(genreSegment)) {
    return NextResponse.json({ error: 'Invalid genre' }, { status: 400 });
  }

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
      image_url,   // <-- new field here
    } = await req.json();

    if (!title || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await sql.query(`SELECT * FROM ${genreSegment} WHERE film = $1`, [title]);

    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Movie already exists' }, { status: 200 });
    }

    await sql.query(
      `INSERT INTO ${genreSegment} (film, year, studio, director, screenwriters, producer, run_time, url, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [title, year, studios, director, screenwriters, producers, run_time, url, image_url]
    );

    return NextResponse.json({ message: 'Movie inserted successfully' }, { status: 201 });

  } catch (error) {
    console.error('Insert failed:', error);
    return NextResponse.json({ error: 'Failed to insert movie' }, { status: 500 });
  }
}