/**
 * Frontend Pre-warming Service
 * 
 * Proactively fetches and caches data for demo users to ensure instant loading
 * when navigating between features. This works in conjunction with backend
 * Redis caching for optimal performance.
 */

interface PrewarmProgress {
  completed: number;
  total: number;
  currentTask: string;
}

type PrewarmCallback = (progress: PrewarmProgress) => void;

class PrewarmService {
  private isPrewarming = false;
  private prewarmPromise: Promise<void> | null = null;

  /**
   * Pre-warm all frontend caches for demo user
   * This should be called immediately after demo login
   */
  async prewarmDemoUserData(
    onProgress?: PrewarmCallback
  ): Promise<void> {
    // Prevent multiple simultaneous pre-warming operations
    if (this.isPrewarming && this.prewarmPromise) {
      return this.prewarmPromise;
    }

    this.isPrewarming = true;
    
    const tasks = [
      { name: 'Transaction Categories', fn: () => this.prewarmTransactionCategories() },
      { name: 'Recent Transactions', fn: () => this.prewarmTransactions() },
      { name: 'Account Summary', fn: () => this.prewarmAccountSummary() },
      { name: 'Monthly Summary', fn: () => this.prewarmMonthlySummary() },
      { name: 'Yearly Summary', fn: () => this.prewarmYearlySummary() },
      { name: 'Active Subscriptions', fn: () => this.prewarmActiveSubscriptions() },
      { name: 'Inactive Subscriptions', fn: () => this.prewarmInactiveSubscriptions() },
      { name: 'Subscription Summary', fn: () => this.prewarmSubscriptionSummary() },
    ];

    this.prewarmPromise = this.executePrewarmTasks(tasks, onProgress);
    
    try {
      await this.prewarmPromise;
      console.log('🔥 Frontend pre-warming completed successfully');
    } catch (error) {
      console.error('❌ Frontend pre-warming failed:', error);
    } finally {
      this.isPrewarming = false;
      this.prewarmPromise = null;
    }

    return this.prewarmPromise;
  }

  /**
   * Execute pre-warming tasks with progress tracking
   */
  private async executePrewarmTasks(
    tasks: Array<{ name: string; fn: () => Promise<void> }>,
    onProgress?: PrewarmCallback
  ): Promise<void> {
    const total = tasks.length;
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      if (onProgress) {
        onProgress({
          completed: i,
          total,
          currentTask: task.name
        });
      }

      try {
        await task.fn();
        console.log(`✅ Pre-warmed: ${task.name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to pre-warm ${task.name}:`, error);
        // Continue with other tasks even if one fails
      }
    }

    if (onProgress) {
      onProgress({
        completed: total,
        total,
        currentTask: 'Complete'
      });
    }
  }

  /**
   * Pre-warm transaction categories
   */
  private async prewarmTransactionCategories(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    await fetch('/api/v1/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  /**
   * Pre-warm recent transactions
   */
  private async prewarmTransactions(): Promise<void> {
    const { fetchTransactions } = await import('./transactionService');
    await fetchTransactions({
      skip: 0,
      limit: 100
    });
  }

  /**
   * Pre-warm account summary
   */
  private async prewarmAccountSummary(): Promise<void> {
    const { getSummary } = await import('./summaryService');
    await getSummary();
  }

  /**
   * Pre-warm monthly summary for current year
   */
  private async prewarmMonthlySummary(): Promise<void> {
    const { getMonthlySummary } = await import('./summaryService');
    const currentYear = new Date().getFullYear();
    await getMonthlySummary(currentYear);
  }

  /**
   * Pre-warm yearly summary for current year
   */
  private async prewarmYearlySummary(): Promise<void> {
    const { getYearlySummary } = await import('./summaryService');
    const currentYear = new Date().getFullYear();
    await getYearlySummary(currentYear);
  }

  /**
   * Pre-warm active subscriptions
   */
  private async prewarmActiveSubscriptions(): Promise<void> {
    const { getSubscriptions } = await import('./subscriptionService');
    await getSubscriptions('active');
  }

  /**
   * Pre-warm inactive subscriptions
   */
  private async prewarmInactiveSubscriptions(): Promise<void> {
    const { getSubscriptions } = await import('./subscriptionService');
    await getSubscriptions('inactive');
  }

  /**
   * Pre-warm subscription summary
   */
  private async prewarmSubscriptionSummary(): Promise<void> {
    const { getSubscriptionSummary } = await import('./subscriptionService');
    await getSubscriptionSummary();
  }

  /**
   * Check if pre-warming is currently in progress
   */
  isInProgress(): boolean {
    return this.isPrewarming;
  }

  /**
   * Clear all frontend caches (useful for testing)
   */
  clearAllCaches(): void {
    try {
      // Clear transaction cache
      import('./transactionService').then(({ transactionCache }) => {
        transactionCache.clear();
      });
      
      // Clear subscription cache
      import('./subscriptionService').then(({ subscriptionCache }) => {
        subscriptionCache.clear();
      });
      
      // Clear summary cache
      import('./summaryService').then(({ clearSummaryCache }) => {
        clearSummaryCache();
      });
      
      console.log('🧹 All frontend caches cleared');
    } catch (error) {
      console.warn('⚠️ Some caches could not be cleared:', error);
    }
  }
}

export const prewarmService = new PrewarmService();
