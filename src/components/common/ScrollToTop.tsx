"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Component that scrolls to the top of the page when the route changes
 */
const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to the top of the page when the pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
