/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AUTH_TOKEN: process.env.AUTH_TOKEN,
  },
};

module.exports = nextConfig;
