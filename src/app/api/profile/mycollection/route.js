import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { username } = params;

  // Replace with your DB call:
  const movies = [
    { url: '/inception', title: 'Inception', image_url: '/images/inception.jpg' },
    { url: '/darkknight', title: 'The Dark Knight', image_url: '/images/darkknight.jpg' }
  ];

  return NextResponse.json({ username, movies });
}
