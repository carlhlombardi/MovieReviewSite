import { sql } from '@vercel/postgres';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    const movie = await getMovieInfo(movieUrl);
    if (!movie) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const watchlistCount = await countWatchlistItems(movieUrl);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ movie, watchlistCount, isInWatchlist: false }),
        { status: 200 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    const isInWatchlistResult = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM watchlist
        WHERE username = ${user.username} AND url = ${movieUrl}
      ) AS isInWatchlist;
    `;
    const isInWatchlist = isInWatchlistResult.rows[0].isInWatchlist;

    return new Response(
      JSON.stringify({ movie, watchlistCount, isInWatchlist }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch watchlist status:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch watchlist status' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    const movie = await getMovieInfo(url);
    if (!movie) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const title = movie.film;
    const genre = movie.genre;

    const postResult = await sql`
      INSERT INTO watchlist (username, url, title, genre)
      VALUES (${user.username}, ${url}, ${title}, ${genre})
      ON CONFLICT (username, url) DO NOTHING
      RETURNING username, url, title, genre;
    `;

    if (postResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item already in watchlist' }),
        { status: 409 }
      );
    }

    const watchlistCountItem = await countWatchlistItems(url);

    return new Response(
      JSON.stringify({ ...postResult.rows[0], watchlistCountItem }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add to watchlist' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    const deleteResult = await sql`
      DELETE FROM watchlist
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url;
    `;

    if (deleteResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item not found in watchlist' }),
        { status: 404 }
      );
    }

    const watchlistCount = await countWatchlistItems(movieUrl);

    return new Response(
      JSON.stringify({ message: 'Item removed from watchlist', watchlistCount }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to remove from watchlist' }),
      { status: 500 }
    );
  }
}
