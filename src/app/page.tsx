'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';

const HomePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Your Profile</h2>
                  <p className="mt-1 text-sm text-gray-500">Email: {user?.email}</p>
                  <p className="mt-1 text-sm text-gray-500">Name: {user?.full_name}</p>
                </div>
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Access</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <a
                      href="/overview"
                      className="block p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <h3 className="text-lg font-medium text-gray-900">Transactions Overview</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        View your financial summary, track income and expenses, and analyze your spending patterns.
                      </p>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
