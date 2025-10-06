import { serialize } from 'cookie';

export async function POST() {
  try {
    const headers = new Headers();
    headers.append('Set-Cookie', serialize('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),   // explicitly expired
      maxAge: 0,
      path: '/',
    }));
    headers.append('Content-Type', 'application/json');

    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ message: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
