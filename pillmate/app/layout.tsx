import type { Metadata } from "next";
import "./globals.css";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";
import { Navigation } from "./components/Navigation";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PillMate – Your Smart Medication Companion",
  description: "Upload prescriptions, track medications, and manage your health with PillMate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plusJakartaSans.variable}`}>
      <body className={`antialiased`}>
        <AuthProvider>
          <Navigation />
          {/* pt-24 on desktop clears the fixed top navbar; pb-24 on mobile clears the pinned bottom navbar */}
          <main className="min-h-screen pt-8 sm:pt-24 pb-24 sm:pb-0">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
