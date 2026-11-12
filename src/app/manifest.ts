import type { MetadataRoute } from "next";

// Gjør at appen kan legges på hjemskjermen med eget navn og ikon,
// og åpnes uten nettleserens adressefelt.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kollektivet",
    short_name: "Kollektivet",
    description: "Felles oversikt for kollektivet",
    lang: "nb",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F8",
    theme_color: "#F5F6F8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
