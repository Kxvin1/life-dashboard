"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ScrollToTop from "@/components/common/ScrollToTop";

interface LayoutContentProps {
  children: ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const { isAuthenticated } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileSidebarOpen]);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Component to handle scrolling to top on route changes */}
      <ScrollToTop />

      {/* Only render sidebars if user is authenticated */}
      {isAuthenticated && (
        <>
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Sidebar */}
          <Sidebar
            isMobile={true}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </>
      )}

      <div className="flex flex-col flex-1 w-full">
        {isAuthenticated && <Navbar onMenuToggle={toggleMobileSidebar} />}
        <main className="flex-1 min-h-screen overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
