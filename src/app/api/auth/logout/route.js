import { serialize } from 'cookie';

export async function POST(request) {
  try {
    // Set the cookie with the expiration time to effectively log out the user
    const headers = new Headers();
    headers.append('Set-Cookie', serialize('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1,
      path: '/',
    }));

    // Return a successful response
    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ message: 'An error occurred' }), { status: 500 });
  }
}
