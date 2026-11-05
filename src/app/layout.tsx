import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instrumentario | Inventario de instrumentos",
  description: "Inventario digital de instrumentos y equipos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
