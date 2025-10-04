import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// === GET: total likes + user like status ===
export async function GET(request) {
  try {
    const urlObj = new URL(request.url);
    const movieUrl = urlObj.searchParams.get('url');

    if (!movieUrl) {
      return new Response(JSON.stringify({ message: 'Movie URL is required' }), {
        status: 400,
      });
    }

    // total like count from the unified view
    const likecountResult = await sql`
      SELECT COUNT(*) AS likecount
      FROM everymovie
      JOIN mycollection ON everymovie.url = mycollection.url
      WHERE mycollection.url = ${movieUrl}
        AND mycollection.image_url IS NOT NULL
        AND mycollection.isliked = TRUE;
    `;
    const likecount = parseInt(likecountResult.rows[0].likecount, 10);

    // auth
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(JSON.stringify({ likecount, isliked: false }), {
        status: 200,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`SELECT username FROM users WHERE id = ${userId};`;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    const islikedResult = await sql`
      SELECT isliked FROM mycollection
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const isliked =
      islikedResult.rowCount > 0 ? islikedResult.rows[0].isliked : false;

    return new Response(JSON.stringify({ likecount, isliked }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Failed to fetch likes' }), {
      status: 500,
    });
  }
}

// === POST: add movie to mycollection ===
export async function POST(request) {
  try {
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

    const userResult = await sql`SELECT username FROM users WHERE id = ${userId};`;
    const user = userResult.rows[0];
    if (!user) {
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

    const postResult = await sql`
      INSERT INTO mycollection (username, url, title, genre, isliked, likedcount, image_url)
      VALUES (${user.username}, ${url}, ${movie.film}, ${movie.genre}, TRUE, 1, ${movie.image_url})
      ON CONFLICT (username, url) DO UPDATE
        SET isliked = EXCLUDED.isliked,
          likedcount = CASE
            WHEN mycollection.isliked = TRUE AND EXCLUDED.isliked = FALSE THEN mycollection.likedcount - 1
            WHEN mycollection.isliked = FALSE AND EXCLUDED.isliked = TRUE THEN mycollection.likedcount + 1
            ELSE mycollection.likedcount END
      RETURNING username, url, title, genre, likedcount, image_url;
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

// === DELETE: remove movie from mycollection ===
export async function DELETE(request) {
  try {
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
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    const deleteResult = await sql`
      UPDATE mycollection
      SET isliked = FALSE
      WHERE username = ${user.username} AND url = ${movieUrl}
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
