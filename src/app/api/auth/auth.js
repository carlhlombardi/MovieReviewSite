import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const client = await pool.connect();
        try {
          const res = await client.query('SELECT * FROM users WHERE email = $1', [credentials.email]);
          const user = res.rows[0];

          if (user && await bcrypt.compare(credentials.password, user.password)) {
            if (!user.is_approved) {
              throw new Error('Account not approved');
            }
            return user;
          } else {
            throw new Error('Invalid credentials');
          }
        } finally {
          client.release();
        }
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    }
  }
});
