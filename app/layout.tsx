import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfeLink — Asesorías académicas en Perú",
  description: "Conecta con los mejores profesores particulares verificados del Perú. Matemáticas, idiomas, programación y más.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
