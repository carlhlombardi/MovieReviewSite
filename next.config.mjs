/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '3000',
          pathname: '/images/**', // Adjust the pathname as needed
        },
        {
          protocol: 'https',
          hostname: 'assets.example.com',
          port: '', // Empty if no port is used
          pathname: '/account123/**',
        },
      ],
      domains: ['drive.google.com'],
    },
  };
  
  export default nextConfig;
  

