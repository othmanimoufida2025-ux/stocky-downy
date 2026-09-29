import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/superadmin/", "/vendeur/"] }, sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://stocky-downy.vercel.app"}/sitemap.xml` }; }
