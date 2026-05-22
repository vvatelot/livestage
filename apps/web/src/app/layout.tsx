import type { Metadata, Viewport } from "next";
import { AppInitializer } from "@/components/app-initializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveStage",
  description: "Gestion de répertoire et prompteur live pour musiciens",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LiveStage",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans">
        <AppInitializer>{children}</AppInitializer>
      </body>
    </html>
  );
}
