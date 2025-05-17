"use client";

import { ReactNode } from "react";
import ScrollToTop from "@/components/common/ScrollToTop";
import AuthNavbar from "@/components/layout/AuthNavbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <ScrollToTop />
      <AuthNavbar />
      <div className="pt-16">{children}</div>
    </div>
  );
}
