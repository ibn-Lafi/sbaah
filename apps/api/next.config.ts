import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * `api` has no rendered pages, only Route Handlers under src/app/v1/**.
   * Keeping React Strict Mode on even for an API-only app catches
   * accidental side effects in shared code early.
   */
  reactStrictMode: true,
};

export default nextConfig;
