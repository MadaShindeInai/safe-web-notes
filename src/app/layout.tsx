import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/layout/theme-provider";
import { TabBarServer } from "~/components/layout/tab-bar-server";
import { PwaRegister } from "~/components/pwa-register";

export const metadata: Metadata = {
  title: "Life Helper",
  description: "Your personal life helper",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html lang="en" className={geist.variable} suppressHydrationWarning>
        <body className="bg-background min-h-dvh font-sans">
          <ThemeProvider>
            <main className="mx-auto w-full max-w-sm pb-16">{children}</main>
            <TabBarServer />
            <Toaster position="bottom-center" />
            <PwaRegister />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
