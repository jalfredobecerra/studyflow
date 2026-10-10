import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Explicit project root avoids tracing a parent Windows package-lock.json.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
