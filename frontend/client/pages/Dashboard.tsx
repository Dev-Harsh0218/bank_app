import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageSquare, TrendingUp, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { getStats, type StatsResponse } from "@/services/stats";
import { getRecentMessages, type RecentMessage } from "@/services/messages";
import { getTopCustomers, searchCustomers, type TopCustomer } from "@/services/customer";

export default function Dashboard() {
  const { user, getTokens, updateTokens, logout } = useAuth();
  const navigate = useNavigate();

  // State for API data
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [searchResults, setSearchResults] = useState<TopCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingTopCustomers, setLoadingTopCustomers] = useState(true);
  const [searching, setSearching] = useState(false);

  // Error states
  const [statsError, setStatsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [topCustomersError, setTopCustomersError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadRecentMessages();
    loadTopCustomers();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
      setSearchError(null);
    }
  }, [searchQuery]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const response = await getStats(getTokens, updateTokens, logout);
      setStats(response.data);
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Failed to load stats');
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadRecentMessages = async () => {
    try {
      setLoadingMessages(true);
      setMessagesError(null);
      const response = await getRecentMessages(5, getTokens, updateTokens, logout);
      setRecentMessages(response.data.messages || []);
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Failed to load messages');
      console.error('Error loading recent messages:', error);
      setRecentMessages([]); // Ensure it's always an array
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadTopCustomers = async () => {
    try {
      setLoadingTopCustomers(true);
      setTopCustomersError(null);
      const response = await getTopCustomers(10, getTokens, updateTokens, logout);
      setTopCustomers(response.data.customers || []);
    } catch (error) {
      setTopCustomersError(error instanceof Error ? error.message : 'Failed to load customers');
      console.error('Error loading top customers:', error);
      setTopCustomers([]); // Ensure it's always an array
    } finally {
      setLoadingTopCustomers(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setSearching(true);
      setSearchError(null);
      const response = await searchCustomers(query, 20, getTokens, updateTokens, logout);
      setSearchResults(response.data.customers || []);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to search customers');
      console.error('Error searching customers:', error);
      setSearchResults([]); // Ensure it's always an array
    } finally {
      setSearching(false);
    }
  };

  // Prepare stats for display
  const statsData = stats ? [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      change: `+${stats.newCustomers} new`,
      icon: Users,
      color: "text-green-400",
      route: "/customers",
    },
    {
      title: "Total Messages",
      value: stats.totalMessages.toString(),
      change: `${stats.unreadMessages} unread`,
      icon: MessageSquare,
      color: "text-orange-400",
      route: "/messages",
    },
    {
      title: "Active Customers",
      value: stats.activeCustomers.toString(),
      change: `${((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)}% active`,
      icon: Activity,
      color: "text-blue-400",
      route: "/customers",
    },
    {
      title: "Total Credit Limit",
      value: `$${(stats.totalCreditLimit / 1000000).toFixed(1)}M`,
      change: "Available credit",
      icon: TrendingUp,
      color: "text-purple-400",
      route: "/customers",
    },
  ] : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers?customer=${customerId}`);
  };

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's your {user?.role.replace("-", " ")} dashboard for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loadingStats ? (
            // Loading skeleton for stats
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            ))
          ) : statsError ? (
            <div className="col-span-full bg-red-950/20 border border-red-500/30 rounded-lg p-6">
              <p className="text-red-400 text-center">{statsError}</p>
              <button 
                onClick={loadStats}
                className="mt-2 mx-auto block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            statsData.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </h3>
                      <div
                        className={`p-2 bg-accent bg-opacity-10 rounded-lg ${stat.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <p className="text-xs text-accent mb-4">{stat.change}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(stat.route)}
                    className="mt-auto inline-flex items-center justify-center rounded-md border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    View more
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Messages */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Recent Messages
              </h2>
              {loadingMessages ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-start gap-4 p-4 rounded-lg border border-transparent">
                        <div className="p-3 rounded-full bg-muted"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded mb-1"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messagesError ? (
                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-center mb-2">{messagesError}</p>
                  <button 
                    onClick={loadRecentMessages}
                    className="mx-auto block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages && recentMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No recent messages</p>
                  ) : (
                    recentMessages && recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start justify-between p-4 rounded-lg hover:bg-slate-700 hover:bg-opacity-30 transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-full bg-sidebar-accent bg-opacity-20">
                            <MessageSquare className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {message.subject}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1">
                              From {message.sender} · {message.date}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {message.preview}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search Customer */}
          <div>
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Search Customer
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Search by customer name or email to quickly find a profile.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search customers..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {searchQuery.trim() && (
                  <div className="border-t border-border pt-4 space-y-3 max-h-64 overflow-y-auto">
                    {searching ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-xs text-muted-foreground mt-2">Searching...</p>
                      </div>
                    ) : searchError ? (
                      <p className="text-xs text-red-400">{searchError}</p>
                    ) : !searchResults || searchResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No customers found.
                      </p>
                    ) : (
                      searchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => handleCustomerClick(customer.id)}
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {customer.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {customer.email}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                              customer.status === "Active"
                                ? "bg-green-950 bg-opacity-30 text-green-400"
                                : "bg-gray-900 bg-opacity-30 text-gray-400"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-accent bg-opacity-10 border border-accent border-opacity-30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">💡 Tip</h3>
              <p className="text-sm text-muted-foreground">
                Keep customer details up to date to resolve queries faster.
              </p>
            </div>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="mt-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Top Customers
            </h2>
            {loadingTopCustomers ? (
              <div className="animate-pulse">
                <div className="h-10 bg-muted rounded mb-4"></div>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 bg-muted rounded mb-2"></div>
                ))}
              </div>
            ) : topCustomersError ? (
              <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-center mb-2">{topCustomersError}</p>
                <button 
                  onClick={loadTopCustomers}
                  className="mx-auto block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!topCustomers || topCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      topCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors"
                        >
                          <td className="py-4 px-4 text-foreground">
                            {customer.name}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {customer.email}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                customer.status === "Active"
                                  ? "bg-green-950 bg-opacity-30 text-green-400"
                                  : "bg-gray-900 bg-opacity-30 text-gray-400"
                              }`}
                            >
                              {customer.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-accent font-semibold">
                            {customer.balance}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}