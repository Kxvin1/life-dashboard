'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';

const Navbar = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  const [isFinanceMenuOpen, setIsFinanceMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFinanceMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigation = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsFinanceMenuOpen(false);
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <Link 
                href="/" 
                className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-gray-500"
                onClick={handleNavigation}
              >
                Home
              </Link>
              <div className="relative flex items-center" ref={dropdownRef}>
                <button
                  onClick={() => setIsFinanceMenuOpen(!isFinanceMenuOpen)}
                  className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-gray-500"
                >
                  Finance
                  <svg
                    className={`ml-1 h-5 w-5 transition-transform duration-200 ${
                      isFinanceMenuOpen ? 'rotate-180' : ''
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {isFinanceMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        href="/overview"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleNavigation}
                      >
                        Overview
                      </Link>
                      <Link
                        href="/finance"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleNavigation}
                      >
                        Add Income/Expense
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 