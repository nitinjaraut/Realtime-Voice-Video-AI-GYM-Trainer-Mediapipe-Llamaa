import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import NavBar from "@/components/ui/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FormFit AI",
  description: "AI-Powered Fitness and Exercise Monitoring System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen pb-10`}>
        <AuthProvider>
          <NavBar />
          <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
