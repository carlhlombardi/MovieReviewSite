// Endpoint to fetch liked movies for the user
export async function GET(request) {
    try {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.split(' ')[1];
  
      if (!token) {
        return new Response(
          JSON.stringify({ message: 'Authorization token is missing' }),
          { status: 401 }
        );
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      // Fetch the liked movies directly
      const likedMoviesResult = await sql`
        SELECT url, film
        FROM likes
        WHERE user_id = ${userId} AND isliked = TRUE;
      `;
  
      const likedMovies = likedMoviesResult.rows;
  
      return new Response(
        JSON.stringify({ likedMovies }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Failed to fetch liked movies:', error);
      return new Response(
        JSON.stringify({ message: 'Failed to fetch liked movies' }),
        { status: 500 }
      );
    }
  }