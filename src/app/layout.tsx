import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import LayoutContent from "@/components/layout/LayoutContent";
import MiniTimer from "@/components/productivity/MiniTimer";
import ThemeScript from "@/components/theme/ThemeScript";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} dark:bg-[#0d1117]`}>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
          <MiniTimer />
        </Providers>
      </body>
    </html>
  );
}
