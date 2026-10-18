import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "./components/site-chrome";
import NotificationCenter from "./components/NotificationCenter";

export const metadata: Metadata = {
  title: "Plastic Policy Database | Asia Pacific",
  description: "A comprehensive repository of plastic-related regulations at the national and regional levels across Asia Pacific.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="scroll-smooth"
    >
      <body className="bg-paper text-foreground min-h-screen flex flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <NotificationCenter />
      </body>
    </html>
  );
}
