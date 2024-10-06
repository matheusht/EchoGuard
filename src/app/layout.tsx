import type { Metadata } from "next";
import "./globals.css";
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

export const metadata: Metadata = {
  title: "EcoGuard",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}