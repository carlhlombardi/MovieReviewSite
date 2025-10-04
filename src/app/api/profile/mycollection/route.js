// src/app/api/profile/[username]/mycollection/route.js
import { NextResponse } from "next/server";

// This ensures Next.js doesn't try to prerender statically
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { username } = params;

  // 🔥 Replace with your DB call:
  const movies = [
    { id: 1, title: "Inception", year: 2010 },
    { id: 2, title: "The Dark Knight", year: 2008 },
  ];

  return NextResponse.json({ username, movies });
}