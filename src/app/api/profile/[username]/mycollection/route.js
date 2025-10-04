import { NextResponse } from 'next/server';

// Force this route to run dynamically (no static errors)
export const dynamic = 'force-dynamic';

// GET /api/profile/:username/mycollection
export async function GET(request, { params }) {
  const { username } = params;

  // TODO: Replace this with your real DB call
  const movies = [
    {
      url: '/inception',
      title: 'Inception',
      genre: 'Sci-Fi',
      image_url: '/images/inception.jpg'
    },
    {
      url: '/darkknight',
      title: 'The Dark Knight',
      genre: 'Action',
      image_url: '/images/darkknight.jpg'
    }
  ];

  return NextResponse.json({ username, movies });
}
