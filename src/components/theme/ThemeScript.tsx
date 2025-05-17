"use client";

import { getThemeScript } from "@/lib/themeScript";
import Script from "next/script";

export default function ThemeScript() {
  return (
    <Script id="theme-script" strategy="beforeInteractive">
      {getThemeScript()}
    </Script>
  );
}
