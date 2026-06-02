import type { Metadata } from "next";
import { Fraunces, Instrument_Serif, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { CartProvider } from "@/lib/hooks/useCart";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { FavoritesProvider } from "@/lib/providers/FavoritesProvider";
import "./globals.css";


const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontEditorial = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlpaCash — Plataforma AgriTech-FinTech para productores de fibra de alpaca",
  description: "Conectamos productores de fibra de alpaca con empresas compradoras del sector textil. Trazabilidad, precios transparentes e historial de transacciones para financiamiento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontEditorial.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--ivory)] text-[var(--foreground)]">
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>{children}</CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
