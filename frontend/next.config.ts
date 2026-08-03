import { resolve } from "node:path";
import type { NextConfig } from "next";
const nextConfig: NextConfig = { images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "res.cloudinary.com" }] }, turbopack: { root: resolve(process.cwd(), "..") } };
export default nextConfig;
