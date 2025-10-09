import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
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
    return null;
  } catch (error) {
    console.error('Error fetching TMDB poster:', error);
    return null;
  }
}

export async function GET(req, { params }) {
  const genre = params.genre.toLowerCase();
  const urlParam = new URL(req.url).searchParams.get('url');

  try {
    if (urlParam) {
      // Single movie by URL
      const result = await sql.query(`SELECT * FROM allmovies WHERE url = $1`, [urlParam]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }
      return NextResponse.json(result.rows[0]);
    } else if (genre === 'allmovies') {
      // All movies
      const result = await sql.query(`SELECT * FROM allmovies`);
      return NextResponse.json(result.rows);
    } else {
      // Movies by genre
      const result = await sql.query(`SELECT * FROM allmovies WHERE genre = $1`, [genre]);
      return NextResponse.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const genre = params.genre.toLowerCase();

  try {
    let {
      film,
      year,
      director = '',
      screenwriters = '',
      producers = '',
      studios = '',
      run_time = null,
      url,
      image_url,
      tmdb_id,
      genre: genreInput,
      my_rating = 0,
      review = ''
    } = await req.json();

    if (!film || !year || !tmdb_id || !genreInput) {
      return NextResponse.json(
        { error: 'Missing required fields: film, year, tmdb_id, or genre' },
        { status: 400 }
      );
    }

    // Normalize studios
    if (Array.isArray(studios)) {
      studios = studios[0];
    } else if (typeof studios === 'string') {
      studios = studios.split(',')[0].trim();
    }

    // Slugify
    const slugify = (film, tmdb_id) => {
      return `${film}-${tmdb_id}`
        .toString()
        .toLowerCase()
        .replace(/'/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const genreSlug = genreInput.toString().toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

    if (!url) {
      url = slugify(film, tmdb_id);
    }

    // Check existing
    const existing = await sql.query(`SELECT * FROM allmovies WHERE tmdb_id = $1 AND genre = $2`, [tmdb_id, genreSlug]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Movie already exists' }, { status: 200 });
    }

    // Fetch poster if missing
    if (!image_url) {
      const fetchedImageUrl = await fetchTmdbPoster(film, year);
      if (fetchedImageUrl) {
        image_url = fetchedImageUrl;
      }
    }

    // Insert/upsert into allmovies (with rating + review)
    await sql.query(
      `INSERT INTO allmovies 
       (film, year, studio, director, screenwriters, producer, run_time, url, image_url, tmdb_id, genre, my_rating, review)
       VALUES 
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (tmdb_id, genre) DO UPDATE
         SET film=$1, year=$2, studio=$3, director=$4, screenwriters=$5,
             producer=$6, run_time=$7, url=$8, image_url=$9, my_rating=$12, review=$13`,
      [film, year, studios, director, screenwriters, producers, run_time, url, image_url, tmdb_id, genreSlug, my_rating, review]
    );

    return NextResponse.json({ message: 'Movie inserted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Insert failed:', error);
    return NextResponse.json({ error: 'Failed to insert movie' }, { status: 500 });
  }
}
