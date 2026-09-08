import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This app lives in a monorepo (Frontend + Backend). Because a .git folder
  // sits inside Frontend, Next would otherwise treat Frontend as the whole
  // project and fail to find the workspace package. Point it at the repo root
  // (one level up) so it can resolve @someday/backend.
  turbopack: {
    root: path.join(process.cwd(), ".."),
  },
  // Let Next import & compile our TypeScript backend package.
  transpilePackages: ["@someday/backend"],
  // Prisma's client loads a native query engine at runtime, so it must NOT be
  // bundled — this keeps it as a normal server-side dependency.
  serverExternalPackages: ["@prisma/client", "@supabase/supabase-js"],
};

export default nextConfig;
