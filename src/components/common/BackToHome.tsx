"use client";

import Link from "next/link";

const BackToHome = () => {
  return (
    <Link href="/">
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md bg-secondary text-foreground hover:bg-secondary/80"
        aria-label="Back to Home"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Back to Home
      </button>
    </Link>
  );
};

export default BackToHome;
