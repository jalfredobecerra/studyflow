
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Keep file tracing inside the Study Flow project.
  outputFileTracingRoot: process.cwd(),

  // Limit concurrent build workers to reduce memory usage.
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
