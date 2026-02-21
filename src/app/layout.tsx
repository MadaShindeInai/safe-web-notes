import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/layout/theme-provider";
import { TabBar } from "~/components/layout/tab-bar";

export const metadata: Metadata = {
  title: "Ralph",
  description: "Your personal life helper",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
        <body className="min-h-screen bg-background font-sans">
          <ThemeProvider>
            <main className="mx-auto w-full max-w-sm pb-16">
              {children}
            </main>
            <TabBar />
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
