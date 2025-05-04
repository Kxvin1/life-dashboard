'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

const SettingsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
      
      <div className="bg-card rounded-xl shadow-md border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Appearance</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-foreground font-medium">Theme</h3>
            <p className="text-sm text-muted-foreground">Choose between light and dark mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>
      </div>
      
      <div className="bg-card rounded-xl shadow-md border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Account</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-foreground font-medium mb-2">Email Notifications</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications"
                className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
              />
              <label htmlFor="email-notifications" className="ml-2 text-foreground">
                Receive email notifications
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-foreground font-medium mb-2">Currency</h3>
            <select className="w-full max-w-xs rounded-md border border-border bg-background text-foreground py-2 px-3">
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
              <option value="jpy">JPY (¥)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
