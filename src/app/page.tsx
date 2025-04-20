import Layout from '@/components/layout/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <p className="text-gray-500">No transactions yet. Add your first transaction to get started!</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
            <p className="text-gray-500">Transaction form will go here</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-500">Financial summary will go here</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
