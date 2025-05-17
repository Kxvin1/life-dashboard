"use client";

import { ReactNode } from "react";
import ScrollToTop from "@/components/common/ScrollToTop";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="home-layout">
      <ScrollToTop />
      {children}
    </div>
  );
}
