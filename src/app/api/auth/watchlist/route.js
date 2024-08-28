import { sql } from '@vercel/postgres';

export async function GET(request) {
  try {
    // Extract the movie URL from the request URL
    const url = new URL(request.url);
    const movieUrl = url.pathname.split('/').pop(); // Assuming the URL ends with the movie URL part

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Get movie info from the URL
    const movie = await getMovieInfo(movieUrl);
    if (!movie) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const { title, genre } = movie; // Extract title and genre

    // Get the total count of watchlist entries for the movie
    const watchlistCount = await countWatchlistItems(movieUrl);

    // Check if the movie is in the authenticated user's watchlist
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ movie: { title, genre }, watchlistCount, isInWatchlist: false }),
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
      JSON.stringify({ movie: { title, genre }, watchlistCount, isInWatchlist }),
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
    // Extract the movie URL from the request URL
    const url = new URL(request.url);
    const movieUrl = url.pathname.split('/').pop(); // Assuming the URL ends with the movie URL part

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Extract the Authorization header and token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get the user from the token
    const user = await getUserFromToken(token);
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Get movie info from the URL
    const movie = await getMovieInfo(movieUrl);
    if (!movie) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const { title, genre } = movie; // Extract title and genre

    // Insert into watchlist
    const postResult = await sql`
      INSERT INTO watchlist (username, url, title, genre)
      VALUES (${user.username}, ${movieUrl}, ${title}, ${genre})
      ON CONFLICT (username, url) DO NOTHING
      RETURNING username, url, title, genre;
    `;

    if (postResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item already in watchlist' }),
        { status: 409 }
      );
    }

    // Get the updated count of the watchlist item
    const watchlistCountItem = await countWatchlistItems(movieUrl);

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
    // Extract the movie URL from the request URL
    const url = new URL(request.url);
    const movieUrl = url.pathname.split('/').pop(); // Assuming the URL ends with the movie URL part

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Extract the Authorization header and token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get the user from the token
    const user = await getUserFromToken(token);
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Delete the movie from the watchlist
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

    // Get the updated count of the watchlist item
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
