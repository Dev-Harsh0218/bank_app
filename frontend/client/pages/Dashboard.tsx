import { CreditCard, TrendingUp, Users, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Balance',
      value: '$24,586.50',
      change: '+2.5%',
      icon: CreditCard,
      color: 'text-accent',
    },
    {
      title: 'Active Accounts',
      value: '12',
      change: '+1 new',
      icon: Users,
      color: 'text-green-400',
    },
    {
      title: 'Monthly Revenue',
      value: '$45,230',
      change: '+12.8%',
      icon: TrendingUp,
      color: 'text-purple-400',
    },
    {
      title: 'Messages',
      value: '24',
      change: '8 unread',
      icon: MessageSquare,
      color: 'text-orange-400',
    },
  ];

  const recentTransactions = [
    {
      id: '1',
      type: 'sent',
      description: 'Payment to Sarah Wilson',
      amount: '-$250.00',
      date: 'Today',
      status: 'completed',
    },
    {
      id: '2',
      type: 'received',
      description: 'Salary Deposit',
      amount: '+$3,500.00',
      date: 'Yesterday',
      status: 'completed',
    },
    {
      id: '3',
      type: 'sent',
      description: 'Utility Bill Payment',
      amount: '-$125.50',
      date: '2 days ago',
      status: 'completed',
    },
    {
      id: '4',
      type: 'received',
      description: 'Freelance Project',
      amount: '+$800.00',
      date: '3 days ago',
      status: 'completed',
    },
  ];

  const topCustomers = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'Active', balance: '$15,240' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'Active', balance: '$8,920' },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com', status: 'Inactive', balance: '$3,100' },
    { id: '4', name: 'David Wilson', email: 'david@example.com', status: 'Active', balance: '$22,450' },
    { id: '5', name: 'Emma Brown', email: 'emma@example.com', status: 'Active', balance: '$11,890' },
  ];

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's your {user?.role.replace('-', ' ')} dashboard for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                  <div className={`p-2 bg-accent bg-opacity-10 rounded-lg ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <p className="text-xs text-accent">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Recent Transactions</h2>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-700 hover:bg-opacity-30 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-full ${
                          transaction.type === 'sent'
                            ? 'bg-red-950 bg-opacity-30'
                            : 'bg-green-950 bg-opacity-30'
                        }`}
                      >
                        {transaction.type === 'sent' ? (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <p
                      className={`font-bold ${
                        transaction.type === 'sent'
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {transaction.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-6">Account Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Primary Account</p>
                  <p className="text-lg font-semibold text-accent">$24,586.50</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Savings Account</p>
                  <p className="text-lg font-semibold text-accent">$12,340.00</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Credit Available</p>
                  <p className="text-lg font-semibold text-accent">$15,000.00</p>
                </div>
                <button className="w-full mt-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
                  View Details
                </button>
              </div>
            </div>

            <div className="bg-accent bg-opacity-10 border border-accent border-opacity-30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">💡 Tip</h3>
              <p className="text-sm text-muted-foreground">
                Set up automatic transfers to build your savings faster.
              </p>
            </div>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="mt-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Top Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-foreground">{customer.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{customer.email}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            customer.status === 'Active'
                              ? 'bg-green-950 bg-opacity-30 text-green-400'
                              : 'bg-gray-900 bg-opacity-30 text-gray-400'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-accent font-semibold">{customer.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
