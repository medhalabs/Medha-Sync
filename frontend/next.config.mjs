if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET && process.env.DOCKER_BUILD !== "1") {
  throw new Error(
    "NEXTAUTH_SECRET is missing. Set it in your hosting environment variables, then redeploy."
  );
}

const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/api/proxy/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
