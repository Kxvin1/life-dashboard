'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SubscriptionsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="bg-card rounded-xl shadow-md border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Subscription Tracker</h2>
        <p className="text-muted-foreground mb-6">
          Track your recurring subscription payments and never miss a due date.
        </p>
        
        <div className="bg-secondary/30 rounded-lg p-6 flex items-center justify-center">
          <div className="text-center">
            <svg 
              className="h-12 w-12 text-primary mx-auto mb-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">Subscription Tracker Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
