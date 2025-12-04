import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { ThemeProvider, themeInitScript } from "@/contexts/ThemeContext";
import { Navigation } from "@/components/navigation/navigation";
import { MainWrapper } from "@/components/layout/main-wrapper";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Critvue - Expert Human Feedback for Creators",
  description: "Get structured, high-quality feedback on your creative work from experienced human reviewers. Level up your skills or earn money by reviewing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {/* Inline script to prevent theme flash on page load */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <Navigation />
              <MainWrapper>
                {children}
              </MainWrapper>
            </AuthProvider>
            <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-inter)',
              },
              className: 'shadow-lg',
              duration: 4000,
            }}
          />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
