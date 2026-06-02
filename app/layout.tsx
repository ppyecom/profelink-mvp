import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/pwa/PWARegister";
import CookieBanner from "@/components/layout/CookieBanner";
import GlobalEffects from "@/components/fx/GlobalEffects";

export const metadata: Metadata = {
  title: "ProfeLink — Asesorías académicas en Perú",
  description: "Conecta con los mejores profesores particulares verificados del Perú. Matemáticas, idiomas, programación y más.",
  manifest: "/manifest.json",
  icons: {
    icon:    "/logo-owl.png",
    shortcut:"/logo-owl.png",
    apple:   "/logo-owl.png",
  },
  appleWebApp: {
    capable: true,
    title: "ProfeLink",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#D97706",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <GlobalEffects />
        <PWARegister />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
