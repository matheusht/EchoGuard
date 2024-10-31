import type { Metadata } from "next";
import "./globals.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { config } from "dotenv";
export const metadata: Metadata = {
  title: "EchoGuard",
  description: "Generated by create next app",
};
config();

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
