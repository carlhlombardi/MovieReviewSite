import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const allowedTables = ['comedymovies', 'horrormovies', 'actionmovies', 'scifimovies'];

async function fetchTmdbPoster(title, year) {
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
    console.log('TMDB search URL:', searchUrl);
    const res = await fetch(searchUrl);
    if (!res.ok) {
      console.error('TMDB search failed:', res.status);
      return null;
    }
    const data = await res.json();
    console.log('TMDB search results:', data);
    if (data.results && data.results.length > 0) {
      const posterPath = data.results[0].poster_path;
      if (posterPath) {
        return `https://image.tmdb.org/t/p/w500${posterPath}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching TMDB poster:', error);
    return null;
  }
}

export async function GET(req, { params }) {
  const genreSegment = params.genre.toLowerCase();

  if (!allowedTables.includes(genreSegment)) {
    return NextResponse.json({ error: 'Invalid genre' }, { status: 400 });
  }

  const urlParam = new URL(req.url).searchParams.get('url');

  try {
    if (urlParam) {
      const result = await sql.query(`SELECT * FROM ${genreSegment} WHERE url = $1`, [urlParam]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }
      return NextResponse.json(result.rows[0]);
    } else {
      const result = await sql.query(`SELECT * FROM ${genreSegment}`);
      return NextResponse.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const genreSegment = params.genre.toLowerCase();

  if (!allowedTables.includes(genreSegment)) {
    return NextResponse.json({ error: 'Invalid genre' }, { status: 400 });
  }

  try {
    let {
      title,
      year,
      director,
      screenwriters,
      producers,
      studios,
      run_time,
      url,
      image_url,   // Optional client-provided image_url
    } = await req.json();

    if (!title || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if movie already exists
    const existing = await sql.query(`SELECT * FROM ${genreSegment} WHERE film = $1`, [title]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Movie already exists' }, { status: 200 });
    }

    // Fetch TMDB poster URL if no image_url provided
    if (!image_url) {
      const fetchedImageUrl = await fetchTmdbPoster(title);
      if (fetchedImageUrl) {
        image_url = fetchedImageUrl;
      }
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