import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Premier Field — Site Routes & Visits",
    short_name: "Premier Field",
    description:
      "Track streets you have driven and log construction site visits for Premier Solutions.",
    start_url: "/field",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#e8f2ef",
    theme_color: "#0f4c45",
    categories: ["business", "navigation", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
