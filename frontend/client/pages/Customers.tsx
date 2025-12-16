import { Search, Plus, MoreVertical, DollarSign, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { useState } from 'react';

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');

  const customers = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1 (555) 123-4567',
      balance: '$15,240.50',
      accountType: 'Premium',
      joinDate: '2023-06-15',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+1 (555) 234-5678',
      balance: '$8,920.00',
      accountType: 'Standard',
      joinDate: '2023-08-20',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      phone: '+1 (555) 345-6789',
      balance: '$3,100.75',
      accountType: 'Starter',
      joinDate: '2024-01-10',
      status: 'Inactive',
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david@example.com',
      phone: '+1 (555) 456-7890',
      balance: '$22,450.00',
      accountType: 'Premium',
      joinDate: '2023-05-05',
      status: 'Active',
    },
    {
      id: '5',
      name: 'Emma Brown',
      email: 'emma@example.com',
      phone: '+1 (555) 567-8901',
      balance: '$11,890.25',
      accountType: 'Standard',
      joinDate: '2023-09-12',
      status: 'Active',
    },
    {
      id: '6',
      name: 'Frank Miller',
      email: 'frank@example.com',
      phone: '+1 (555) 678-9012',
      balance: '$5,670.00',
      accountType: 'Standard',
      joinDate: '2023-11-08',
      status: 'Active',
    },
  ];

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = customers.reduce(
    (sum, c) => sum + parseFloat(c.balance.replace(/[$,]/g, '')),
    0
  );

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Customers</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage and track your customer accounts</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
              <Plus className="w-5 h-5" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-foreground">{customers.length}</p>
              </div>
              <div className="p-2 bg-blue-950 bg-opacity-30 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-accent">${(totalBalance / 1000).toFixed(1)}K</p>
              </div>
              <div className="p-2 bg-green-950 bg-opacity-30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Accounts</p>
                <p className="text-2xl font-bold text-foreground">
                  {customers.filter(c => c.status === 'Active').length}
                </p>
              </div>
              <div className="p-2 bg-purple-950 bg-opacity-30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-800 bg-opacity-50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Email</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Account Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Balance</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900 bg-opacity-20' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent bg-opacity-20 rounded-full flex items-center justify-center">
                          <span className="text-accent font-semibold text-sm">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{customer.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.accountType === 'Premium'
                            ? 'bg-yellow-950 bg-opacity-30 text-yellow-400'
                            : 'bg-blue-950 bg-opacity-30 text-blue-400'
                        }`}
                      >
                        {customer.accountType}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">{customer.balance}</span>
                    </td>
                    <td className="py-4 px-6">
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
                    <td className="py-4 px-6 text-center">
                      <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors inline-flex">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No customers found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
