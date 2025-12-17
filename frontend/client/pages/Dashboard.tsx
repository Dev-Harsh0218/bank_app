import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    {
      title: "Total Customers",
      value: "120",
      change: "+5 new",
      icon: Users,
      color: "text-green-400",
      route: "/customers",
    },
    {
      title: "Total Messages",
      value: "24",
      change: "8 unread",
      icon: MessageSquare,
      color: "text-orange-400",
      route: "/messages",
    },
  ];

  const recentMessages = [
    {
      id: "1",
      sender: "Alice Johnson",
      subject: "Issue with recent payment",
      preview: "Hi, I noticed a discrepancy in my last statement...",
      date: "Today",
      status: "unread",
    },
    {
      id: "2",
      sender: "Bob Smith",
      subject: "Account limit query",
      preview: "Could you please confirm my current credit limit?",
      date: "Yesterday",
      status: "read",
    },
    {
      id: "3",
      sender: "Carol Davis",
      subject: "Update contact details",
      preview: "I would like to update my phone number and address...",
      date: "2 days ago",
      status: "read",
    },
    {
      id: "4",
      sender: "David Wilson",
      subject: "Feedback on service",
      preview: "Just wanted to share some feedback about my experience...",
      date: "3 days ago",
      status: "unread",
    },
  ];

  const topCustomers = [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@example.com",
      status: "Active",
      balance: "$15,240",
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob@example.com",
      status: "Active",
      balance: "$8,920",
    },
    {
      id: "3",
      name: "Carol Davis",
      email: "carol@example.com",
      status: "Inactive",
      balance: "$3,100",
    },
    {
      id: "4",
      name: "David Wilson",
      email: "david@example.com",
      status: "Active",
      balance: "$22,450",
    },
    {
      id: "5",
      name: "Emma Brown",
      email: "emma@example.com",
      status: "Active",
      balance: "$11,890",
    },
  ];

  const filteredCustomers = topCustomers.filter((c) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {stats.map((stat) => {
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
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Messages */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Recent Messages
              </h2>
              <div className="space-y-4">
                {recentMessages.map((message) => (
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
                ))}
              </div>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {searchQuery.trim() && (
                  <div className="border-t border-border pt-4 space-y-3 max-h-64 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No customers found.
                      </p>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/40 transition-colors"
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
                  {topCustomers.map((customer) => (
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
