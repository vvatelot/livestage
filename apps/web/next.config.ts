import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import path from "path";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const isNetlify = process.env.NETLIFY === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // standalone is for Docker; Netlify uses @netlify/plugin-nextjs + .next output
  ...(!isNetlify && {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname, "../../"),
  }),
};

export default withSerwist(nextConfig);
