/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ['10.0.0.250'],

  distDir:
    process.env.NODE_ENV === 'development'
      ? '.next-dev'
      : '.next',
};

export default nextConfig;
