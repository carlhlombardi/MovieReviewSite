// /pages/api/auth/logout.js
import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method === 'POST') {
    // Set the cookie with an expired date to remove it
    res.setHeader('Set-Cookie', serialize('token', '', {
      httpOnly: true,        // Prevents JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS only in production
      sameSite: 'strict',    // Prevents the cookie from being sent with cross-site requests
      maxAge: 0,             // Sets the cookie to expire immediately
      path: '/',             // Path for which the cookie is valid
    }));
    
    // Respond with a success message
    res.status(200).json({ message: 'Logged out successfully' });
  } else {
    // Handle methods other than POST
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
