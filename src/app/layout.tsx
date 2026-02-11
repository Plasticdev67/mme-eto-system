import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutProvider } from "@/components/layout/layout-context";
import { LayoutShell } from "@/components/layout/layout-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MME System | MM Engineered Solutions",
  description: "Business management system for MM Engineered Solutions Ltd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider>
          <LayoutProvider>
            <LayoutShell>{children}</LayoutShell>
          </LayoutProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
