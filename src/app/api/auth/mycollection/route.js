import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// === GET: return full mycollection for a user ===
export async function GET(request, { params }) {
  try {
    const { username } = params;

    // fetch all items from mycollection for this user
    const result = await sql`
      SELECT url, title, genre, image_url, isliked, iswatched
      FROM mycollection
      WHERE username = ${username};
    `;

    return new Response(JSON.stringify({ movies: result.rows }), {
      status: 200,
    });
  } catch (error) {
    console.error('Fetch mycollection error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch collection' }),
      { status: 500 }
    );
  }
}

// === POST: add or like a movie ===
export async function POST(request, { params }) {
  try {
    const { username } = params;
    const { url } = await request.json();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // double-check username matches token
    const userResult = await sql`SELECT username FROM users WHERE id = ${userId};`;
    const user = userResult.rows[0];
    if (!user || user.username !== username) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    // get movie details from unified view
    const movieResult = await sql`
      SELECT film, genre, image_url FROM everymovie WHERE url = ${url};
    `;
    const movie = movieResult.rows[0];
    if (!movie) {
      return new Response(JSON.stringify({ message: 'Movie not found' }), {
        status: 404,
      });
    }

    // insert or update
    await sql`
      INSERT INTO mycollection (username, url, title, genre, isliked, image_url)
      VALUES (${username}, ${url}, ${movie.film}, ${movie.genre}, TRUE, ${movie.image_url})
      ON CONFLICT (username, url) DO UPDATE
        SET isliked = TRUE; -- mark liked if existed
    `;

    return new Response(JSON.stringify({ message: 'Item liked' }), {
      status: 201,
    });
  } catch (error) {
    console.error('Add like error:', error);
    return new Response(JSON.stringify({ message: 'Failed to add like' }), {
      status: 500,
    });
  }
}

// === DELETE: unlike / remove a movie ===
export async function DELETE(request, { params }) {
  try {
    const { username } = params;
    const urlObj = new URL(request.url);
    const movieUrl = urlObj.searchParams.get('url');

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized or missing movie URL' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`SELECT username FROM users WHERE id = ${userId};`;
    const user = userResult.rows[0];
    if (!user || user.username !== username) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    const deleteResult = await sql`
      UPDATE mycollection
      SET isliked = FALSE
      WHERE username = ${username} AND url = ${movieUrl}
      RETURNING username, url;
    `;
    if (deleteResult.rowCount === 0) {
      return new Response(JSON.stringify({ message: 'Item not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: 'Like removed' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Delete like error:', error);
    return new Response(JSON.stringify({ message: 'Failed to remove like' }), {
      status: 500,
    });
  }
}
