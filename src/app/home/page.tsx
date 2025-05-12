"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedGradient from "@/components/layout/AnimatedGradient";

const HomePage = () => {
  return (
    <>
      <AnimatedGradient />
      <div className="flex flex-col w-full min-h-screen">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-sm dark:bg-[#0d1117]/80 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Life Dashboard
                </span>
              </div>
              <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                  <span className="block">Manage your life</span>
                  <span className="block text-blue-600">all in one place</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  Life Dashboard helps you organize your finances, track your
                  productivity, monitor your health, and manage your personal
                  life with a beautiful, intuitive interface.
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
                          src="/images/dashboard-landing-image.png"
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
                Everything you need to stay organized
              </p>
              <p className="max-w-2xl mt-4 text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
                Life Dashboard combines multiple tools into one seamless
                experience.
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
                      Track your income, expenses, and net worth. Set budgets
                      and monitor your financial health.
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
                      Manage tasks, track habits, set goals, and measure your
                      time effectively.
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
                      Track your mood, practice gratitude, log sleep, and
                      maintain mindfulness.
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
                      Keep notes, manage reading lists, organize files, and
                      track skills development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-blue-600">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block">Create your account today.</span>
            </h2>
            <div className="flex mt-8 lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-blue-600 bg-white border border-transparent rounded-md hover:bg-gray-50"
                >
                  Get Started
                </Link>
              </div>
              <div className="inline-flex ml-3 rounded-md shadow">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-blue-700 border border-transparent rounded-md hover:bg-blue-800"
                >
                  Sign In
                </Link>
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
    </>
  );
};

export default HomePage;
