/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AI_MODEL_NAME: process.env.AI_MODEL_NAME,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_API_KEY: process.env.AI_API_KEY,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    AUTH_TOKEN: process.env.AUTH_TOKEN,
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
};

module.exports = nextConfig;
