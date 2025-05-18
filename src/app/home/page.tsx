"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import AnimatedGradient from "@/components/layout/AnimatedGradient";
import { useTheme } from "@/contexts/ThemeContext";
import MobileMenu from "@/components/layout/MobileMenu";

const HomePage = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Ensure theme toggle works immediately on page load
  useEffect(() => {
    // Force a re-render of the theme state to ensure it's in sync with localStorage
    const currentTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    if (currentTheme && currentTheme !== theme) {
      // This will update the theme state to match localStorage
      if (currentTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  return (
    <div className="relative">
      <AnimatedGradient />

      {/* Fixed position navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <nav className="bg-white/90 backdrop-blur-sm dark:bg-[#0d1117]/90 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Life Dashboard
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="items-center hidden space-x-4 md:flex">
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-700 bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                </button>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>

              {/* Mobile Hamburger Button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 text-gray-700 rounded-md dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Open menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content with padding to account for fixed navbar */}
      <div className="flex flex-col w-full min-h-screen pt-16">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-5xl">
                  <span className="block">Take control of your life</span>
                  <span className="block text-blue-600">
                    all in one secure place
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  Use AI-powered tools to organize your money, time, and health
                  - and uncover insights you might miss on your own.
                  <br />
                  <br />
                  All through a beautiful, intuitive interface with your data
                  kept private and protected.
                </p>
                <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
              <div className="relative mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div className="relative w-full mx-auto rounded-lg shadow-lg lg:max-w-md">
                  <div className="relative block w-full overflow-hidden bg-white rounded-lg dark:bg-gray-800">
                    <div className="relative mx-auto overflow-hidden rounded-lg">
                      <div className="aspect-[2/3] w-full max-w-md">
                        <Image
                          src="/images/dashboard-landing-image-1.png"
                          alt="Dashboard Preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base font-semibold tracking-wide text-blue-600 uppercase">
                Features
              </h2>
              <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Simple tools. Supercharged by AI.
              </p>
              <p className="max-w-2xl mt-4 text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
                Turns everyday tasks into AI enhanced experiences - helping you
                make smarter decisions, stay organized, and feel in control.
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {/* Finance Feature */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center w-12 h-12 text-white bg-blue-500 rounded-md">
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Finance Tracking
                    </h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      See where your money goes, get smart budgeting tips, and
                      track your net worth with AI-powered insights.
                    </p>
                  </div>
                </div>

                {/* Productivity Feature */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center w-12 h-12 text-white bg-blue-500 rounded-md">
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Productivity Tools
                    </h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      Stay focused and consistent with goal tracking, habit
                      suggestions, and time use analysis tailored to you.
                    </p>
                  </div>
                </div>

                {/* Health Feature */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center w-12 h-12 text-white bg-blue-500 rounded-md">
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Health Monitoring
                    </h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      Understand your mood, sleep, and mental well-being through
                      AI enhanced, personalized tracking.
                    </p>
                  </div>
                </div>

                {/* Personal Organization Feature */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center w-12 h-12 text-white bg-blue-500 rounded-md">
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Personal Organization
                    </h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      Effortlessly manage notes, files, reading, and skills -
                      with AI that keeps everything in sync.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Image | Text Section */}
        <section className="py-16 bg-white dark:bg-[#0d1117]">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="relative mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div className="relative w-full mx-auto rounded-lg shadow-lg lg:max-w-md">
                  <div className="relative block w-full overflow-hidden bg-white rounded-lg dark:bg-gray-800">
                    <div className="relative mx-auto overflow-hidden rounded-lg">
                      <div className="aspect-[2/3] w-full max-w-md">
                        <Image
                          src="/images/dashboard-landing-image-4.png"
                          alt="Dashboard Preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
                <div>
                  <h2 className="text-base font-semibold tracking-wide text-blue-600 uppercase">
                    Seamless Experience
                  </h2>
                  <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Designed for everyday life, enhanced by AI
                  </p>
                  <p className="mt-4 text-lg text-gray-500 dark:text-gray-300">
                    With a clean interface and smart automation that makes
                    managing your life effortless, across all your devices.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Text | Image Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
                <div>
                  <h2 className="text-base font-semibold tracking-wide text-blue-600 uppercase">
                    Powerful Analytics
                  </h2>
                  <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Clear insights. Smarter decisions.
                  </p>
                  <p className="mt-4 text-lg text-gray-500 dark:text-gray-300">
                    AI-driven insights surface hidden patterns and trends -
                    helping you make smarter decisions, spot opportunities, and
                    stay one step ahead.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
              <div className="relative mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div className="relative w-full mx-auto rounded-lg shadow-lg lg:max-w-md">
                  <div className="relative block w-full overflow-hidden bg-white rounded-lg dark:bg-gray-800">
                    <div className="relative mx-auto overflow-hidden rounded-lg">
                      <div className="aspect-[2/3] w-full max-w-md">
                        <Image
                          src="/images/dashboard-landing-image-7.png"
                          alt="Analytics Preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white dark:bg-[#0d1117]">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base font-semibold tracking-wide text-blue-600 uppercase">
                Getting Started
              </h2>
              <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                How Life Dashboard Works
              </p>
              <p className="max-w-2xl mt-4 text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
                Start organizing your life in just a few simple steps
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      1
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    Create an Account
                  </h3>
                  <p className="text-center text-gray-500 dark:text-gray-300">
                    Sign up in seconds with just your name and email. No credit
                    card required.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      2
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    Customize Your Dashboard
                  </h3>
                  <p className="text-center text-gray-500 dark:text-gray-300">
                    Add your favorite tools to Quick Access for a personalized
                    experience.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      3
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    Start Organizing
                  </h3>
                  <p className="text-center text-gray-500 dark:text-gray-300">
                    Begin tracking your finances, tasks, health metrics, and
                    personal goals all in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base font-semibold tracking-wide text-blue-600 uppercase">
                Key Benefits
              </h2>
              <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Why Choose Life Dashboard
              </p>
              <p className="max-w-2xl mt-4 text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
                Discover how our all-in-one platform can transform your daily
                life
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {/* Benefit 1 */}
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 text-white bg-blue-500 rounded-full">
                    <svg
                      className="w-8 h-8"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-center text-gray-900 dark:text-white">
                    All-in-One Solution
                  </h3>
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    Combine multiple apps into one seamless platform. No more
                    switching between different tools.
                  </p>
                </div>

                {/* Benefit 2 */}
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 text-white bg-blue-500 rounded-full">
                    <svg
                      className="w-8 h-8"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-center text-gray-900 dark:text-white">
                    Privacy Focused
                  </h3>
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    Your data stays private and secure. We don&apos;t sell your
                    information or show ads.
                  </p>
                </div>

                {/* Benefit 3 */}
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 text-white bg-blue-500 rounded-full">
                    <svg
                      className="w-8 h-8"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-center text-gray-900 dark:text-white">
                    Customizable Interface
                  </h3>
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    Personalize your dashboard with the tools you use most.
                    Create a workspace that works for you.
                  </p>
                </div>

                {/* Benefit 4 */}
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 text-white bg-blue-500 rounded-full">
                    <svg
                      className="w-8 h-8"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-center text-gray-900 dark:text-white">
                    Boost Productivity
                  </h3>
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    Save time and reduce stress by having all your important
                    tools and information in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-blue-600">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Ready to get started?</span>
                <span className="block">Create your account today.</span>
              </h2>
              <div className="flex justify-center mt-8 space-x-4">
                <div className="inline-flex rounded-md shadow">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-blue-600 bg-white border border-transparent rounded-md hover:bg-gray-50"
                  >
                    Get Started
                  </Link>
                </div>
                <div className="inline-flex rounded-md shadow">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-blue-700 border border-transparent rounded-md hover:bg-blue-800"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white dark:bg-[#0d1117] mt-auto">
          <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800 md:flex md:items-center md:justify-between">
              <div className="flex justify-center w-full">
                <p className="text-base text-center text-gray-400">
                  &copy; {new Date().getFullYear()} Life Dashboard. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
