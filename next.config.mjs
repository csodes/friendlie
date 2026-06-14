/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase Storage public buckets serve images from this host.
    // Replace the project ref via your own Supabase URL host if needed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
