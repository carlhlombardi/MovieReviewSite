import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// ───────────────────────────────
// Helper → fetch poster from TMDB
// ───────────────────────────────
async function fetchTmdbPoster(title, year) {
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      title
    )}${year ? `&year=${year}` : ""}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      console.error("TMDB search failed:", searchRes.status);
      return null;
    }

    const searchData = await searchRes.json();
    if (!searchData.results?.length) return null;

    const posterPath = searchData.results[0].poster_path;
    return posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : null;
  } catch (error) {
    console.error("Error fetching TMDB poster:", error);
    return null;
  }
}

// ───────────────────────────────
// GET → fetch movie(s)
// ───────────────────────────────
export async function GET(req, { params }) {
  const genre = params.genre.toLowerCase();
  const urlParam = decodeURIComponent(
    new URL(req.url).searchParams.get("url") || ""
  );

  try {
    if (urlParam) {
      // 🎬 Single movie by URL
      const { rows } = await sql`
        SELECT * FROM allmovies WHERE url = ${urlParam};
      `;

      if (rows.length === 0) {
        return NextResponse.json({ error: "Movie not found" }, { status: 404 });
      }

      console.log("🎬 Movie fetched:", rows[0]); // ✅ Debug log

      return NextResponse.json(rows[0]);
    }

    // 🗂️ All movies or by genre
    const query =
      genre === "allmovies"
        ? sql`SELECT * FROM allmovies;`
        : sql`SELECT * FROM allmovies WHERE genre = ${genre};`;

    const { rows } = await query;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ───────────────────────────────
// POST → add/update a movie
// ───────────────────────────────
export async function POST(req, { params }) {
  const genre = params.genre.toLowerCase();

  try {
    let {
      film,
      year,
      director = "",
      screenwriters = "",
      producers = "",
      studios = "",
      run_time = null,
      url,
      image_url,
      tmdb_id,
      genre: genreInput,
      my_rating = 0,
      review = "",
    } = await req.json();

    // ✅ Validate required fields
    if (!film || !year || !tmdb_id || !genreInput) {
      return NextResponse.json(
        { error: "Missing required fields: film, year, tmdb_id, or genre" },
        { status: 400 }
      );
    }

    // ✅ Normalize studio name
    if (Array.isArray(studios)) studios = studios[0];
    else if (typeof studios === "string") studios = studios.split(",")[0].trim();

    // ✅ Slugify movie URL
    const slugify = (film, tmdb_id) =>
      `${film}-${tmdb_id}`
        .toString()
        .toLowerCase()
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const genreSlug = genreInput
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();

    if (!url) url = slugify(film, tmdb_id);

    // ✅ Check for existing entry
    const existing = await sql`
      SELECT * FROM allmovies WHERE tmdb_id = ${tmdb_id} AND genre = ${genreSlug};
    `;
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: "Movie already exists" }, { status: 200 });
    }

    // ✅ Fetch poster if missing
    if (!image_url) {
      const fetchedImageUrl = await fetchTmdbPoster(film, year);
      if (fetchedImageUrl) image_url = fetchedImageUrl;
    }

    // ✅ Insert or update movie
    await sql`
      INSERT INTO allmovies 
        (film, year, studio, director, screenwriters, producer, run_time, url, image_url, tmdb_id, genre, my_rating, review)
      VALUES 
        (${film}, ${year}, ${studios}, ${director}, ${screenwriters}, ${producers}, ${run_time}, ${url}, ${image_url}, ${tmdb_id}, ${genreSlug}, ${my_rating}, ${review})
      ON CONFLICT (tmdb_id, genre) DO UPDATE
        SET film = ${film},
            year = ${year},
            studio = ${studios},
            director = ${director},
            screenwriters = ${screenwriters},
            producer = ${producers},
            run_time = ${run_time},
            url = ${url},
            image_url = ${image_url},
            my_rating = ${my_rating},
            review = ${review};
    `;

    return NextResponse.json({ message: "Movie inserted successfully" }, { status: 201 });
  } catch (error) {
    console.error("Insert failed:", error);
    return NextResponse.json({ error: "Failed to insert movie" }, { status: 500 });
  }
}
