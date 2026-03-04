import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/builder", "/editor/", "/profile", "/onboarding", "/admin", "/referrals", "/resume-score", "/linkedin-audit"],
      },
    ],
    sitemap: "https://getplaced.in/sitemap.xml",
  };
}
