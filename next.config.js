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
  async headers() {
    return [
    {
        source: "/api/:path*",
        headers: [
            { key: "Access-Control-Allow-Origin", value: "*" },
            { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
            { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
    }
];
}
};

module.exports = nextConfig;