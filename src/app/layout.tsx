import type { Metadata } from "next";
import "./globals.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { config } from "dotenv";
config();
export const metadata: Metadata = {
  openGraph: {
    title: {
      default: "EchoGuard",
      template: `%s - EchoGuard`,
    },
    description:
      "Mapa sobre Previsão de Risco de Incêndio para uso de autoridades e comunidades locais ",
    type: "website",
    url: "/",
    siteName: "EchoGuard",
    images: [
      {
        url: "../assets/sociall.png",
        width: 1602,
        height: 867,
        alt: "EchoGuard",
      },
    ],
  },
  icons: {
    icon: "/assets/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
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
