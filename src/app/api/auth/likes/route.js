import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

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

    // Get the total like count for the movie
    const likecountResult = await sql`
      SELECT COUNT(*) AS likecount
      FROM likes
      WHERE url = ${movieUrl} AND isliked = TRUE;
    `;
    const likecount = parseInt(likecountResult.rows[0].likecount, 10);

    console.log(`Like count for ${movieUrl}: ${likecount}`); // Log like count

    // Check if the user has liked the movie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ likecount, isliked: false, title: '' }),
        { status: 200 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    console.log(`Decoded userId: ${userId}`); // Log userId

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    console.log(`Fetched user: ${JSON.stringify(user)}`); // Log user

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Fetch like status and movie title
    const likeDetailsResult = await sql`
      SELECT isliked, title
      FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;

    console.log(`Query result for like details: ${JSON.stringify(likeDetailsResult.rows)}`); // Log like details

    const isliked = likeDetailsResult.rowCount > 0 ? likeDetailsResult.rows[0].isliked : false;
    const title = likeDetailsResult.rowCount > 0 ? likeDetailsResult.rows[0].title : '';

    // Log final isliked value and movie title
    console.log(`Is liked by user: ${isliked}`);
    console.log(`Movie title: ${title}`);

    return new Response(
      JSON.stringify({ likecount, isliked, title }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch likes:', error); // Log full error
    return new Response(
      JSON.stringify({ message: 'Failed to fetch likes' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url, title } = await request.json(); // Extract both URL and title from the request body
    console.log('POST Request - URL:', url, 'Title:', title);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
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
    console.log('User Found:', user.username);

    // Insert or update the like record with the title
    const postResult = await sql`
      INSERT INTO likes (username, url, title, isliked)
      VALUES (${user.username}, ${url}, ${title}, TRUE)
      ON CONFLICT (username, url) DO UPDATE SET title = ${title}, isliked = TRUE
      RETURNING username, url, title;
    `;
    console.log('POST Result:', postResult);

    if (postResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item already liked' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Item liked', title: postResult.rows[0].title }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add like error:', error);  // Log full error
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
    console.log('DELETE Request - Movie URL:', movieUrl);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized or missing movie URL' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
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
    console.log('User Found:', user.username);

    // Fetch the current title before deleting
    const titleResult = await sql`
      SELECT title
      FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const currentTitle = titleResult.rowCount > 0 ? titleResult.rows[0].title : null;

    // Update the like record to set isliked to FALSE
    const deleteResult = await sql`
      UPDATE likes
      SET isliked = FALSE
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url, title;
    `;
    console.log('DELETE Result:', deleteResult);

    if (deleteResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Like not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Like removed', title: currentTitle }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete like error:', error);  // Log full error
    return new Response(
      JSON.stringify({ message: 'Failed to remove like' }),
      { status: 500 }
    );
  }
}