export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
  
    if (!query) {
      return Response.json({ error: 'Missing query' }, { status: 400 });
    }
  
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
  
    return Response.json(data);
  }