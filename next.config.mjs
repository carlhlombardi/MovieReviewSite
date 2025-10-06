/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // your existing TMDB pattern
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      // add Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**', // all paths under res.cloudinary.com
      },
    ],
  },
};

export default nextConfig;

  

