import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blackthorn's Tropical Plants | From Node to Jungle",
  description:
    "Oregon-grown tropical plants, monstera cuttings, rooted starts, and care guidance from Blackthorn's Tropical Plants.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/assets/images/favicon-192.png",
    shortcut: "/assets/images/favicon-192.png",
    apple: "/assets/images/favicon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
