import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const allowedTables = [
  'actionmovies',
  'adventuremovies',
  'animationmovies',
  'comedymovies',
  'crimemovies',
  'documentarymovies',
  'dramamovies',
  'familymovies',
  'fantasymovies',
  'historymovies',
  'horrormovies',
  'musicmovies',
  'mysterymovies',
  'romancemovies',
  'sciencefictionmovies',
  'tvmoviemovies',
  'thrillermovies',
  'warmovies',
  'westernmovies'
];


const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function fetchTmdbPoster(title, year) {
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      console.error('TMDB search failed:', searchRes.status);
      return null;
    }
    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) {
      console.log('No TMDB movie found for', title);
      return null;
    }

    const posterPath = searchData.results[0].poster_path;
    if (posterPath) {
      return `https://image.tmdb.org/t/p/w500${posterPath}`;
    }

    return null; // No fallback to backdrops
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
      image_url,
    } = await req.json();

    if (!title || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use only the first studio
    if (Array.isArray(studios)) {
      studios = studios[0];
    } else if (typeof studios === 'string') {
      studios = studios.split(',')[0].trim();
    }

    const existing = await sql.query(`SELECT * FROM ${genreSegment} WHERE film = $1`, [title]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Movie already exists' }, { status: 200 });
    }

    if (!image_url) {
      const fetchedImageUrl = await fetchTmdbPoster(title, year);
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