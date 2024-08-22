import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const movieTables = [
  'actionmovies',
  'classicmovies',
  'comedymovies',
  'documentarymovies',
  'dramamovies',
  'horrormovies',
  'scifimovies'
];

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

    // Find the genre and table for the movie URL
    let genre = '';
    let movieTable = '';

    for (const table of movieTables) {
      const result = await sql`
        SELECT genre
        FROM ${sql(table)}
        WHERE url = ${movieUrl};
      `;
      if (result.rowCount > 0) {
        genre = result.rows[0].genre;
        movieTable = table;
        break;
      }
    }

    if (!movieTable) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    // Get the total like count for the movie
    const likecountResult = await sql`
      SELECT COUNT(*) AS likecount
      FROM likes
      WHERE url = ${movieUrl} AND isliked = TRUE;
    `;
    const likecount = parseInt(likecountResult.rows[0].likecount, 10);

    // Check if the user has liked the movie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ likecount, isliked: false, title: '', genre: genre }),
        { status: 200 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Fetch like status and movie title
    const likeDetailsResult = await sql`
      SELECT l.isliked, m.title
      FROM likes l
      JOIN ${sql(movieTable)} m ON l.url = m.url
      WHERE l.username = ${user.username} AND l.url = ${movieUrl};
    `;

    const isliked = likeDetailsResult.rowCount > 0 ? likeDetailsResult.rows[0].isliked : false;
    const title = likeDetailsResult.rowCount > 0 ? likeDetailsResult.rows[0].title : '';

    return new Response(
      JSON.stringify({ likecount, isliked, title, genre }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch likes:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch likes' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url, title } = await request.json(); // Extract URL and title from request body

    if (!url || !title) {
      return new Response(
        JSON.stringify({ message: 'URL and title are required' }),
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Find the genre and table for the movie URL
    let movieTable = '';
    let genre = '';

    for (const table of movieTables) {
      const result = await sql`
        SELECT genre
        FROM ${sql(table)}
        WHERE url = ${url};
      `;
      if (result.rowCount > 0) {
        genre = result.rows[0].genre;
        movieTable = table;
        break;
      }
    }

    if (!movieTable) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    // Insert or update the like record with the title and genre in the appropriate table
    const postResult = await sql`
      INSERT INTO likes (username, url, title, genre, isliked)
      VALUES (${user.username}, ${url}, ${title}, ${genre}, TRUE)
      ON CONFLICT (username, url) DO UPDATE SET title = ${title}, genre = ${genre}, isliked = TRUE
      RETURNING username, url, title, genre;
    `;

    if (postResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item already liked' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Item liked', title: postResult.rows[0].title, genre: postResult.rows[0].genre }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add like error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add like' }),
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Find the genre and table for the movie URL
    let movieTable = '';
    let currentTitle = '';
    let currentGenre = '';

    for (const table of movieTables) {
      const result = await sql`
        SELECT title, genre
        FROM ${sql(table)}
        WHERE url = ${movieUrl};
      `;
      if (result.rowCount > 0) {
        currentTitle = result.rows[0].title;
        currentGenre = result.rows[0].genre;
        movieTable = table;
        break;
      }
    }

    if (!movieTable) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    // Update the like record to set isliked to FALSE
    const deleteResult = await sql`
      UPDATE likes
      SET isliked = FALSE
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url, title, genre;
    `;

    if (deleteResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Like not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Like removed', title: currentTitle, genre: currentGenre }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete like error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to remove like' }),
      { status: 500 }
    );
  }
}