import {
  Search,
  Plus,
  MoreVertical,
  Users,
  UserCheck,
  DollarSign,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCustomers, Customer } from "@/services/customer";
import { toast } from "@/components/ui/use-toast";

export default function Customers() {
  const { getTokens, updateTokens, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!getTokens) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await getCustomers(getTokens, updateTokens, logout);
        setCustomers(response.data);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch customers";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [getTokens, updateTokens, logout]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_number.includes(searchQuery),
  );

  // Calculate totals for stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;
  const totalCreditLimit = customers.reduce((sum, c) => sum + c.total_limit, 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-3 sm:p-4 md:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-3 sm:p-4 md:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-400 mb-4">Failed to load customers</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                Customers
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage and track your customer accounts
              </p>
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
                <p className="text-sm text-muted-foreground mb-1">
                  Total Customers
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalCustomers}
                </p>
              </div>
              <div className="p-2 bg-blue-950 bg-opacity-30 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Customers
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activeCustomers}
                </p>
              </div>
              <div className="p-2 bg-green-950 bg-opacity-30 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Credit Limit
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${totalCreditLimit.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-purple-950 bg-opacity-30 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-400" />
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
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent px-2 sm:px-4">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b border-border bg-slate-800 bg-opacity-50">
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[220px] sticky left-0 bg-slate-800 bg-opacity-50 z-10">
                    Name
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[220px]">
                    Email
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[170px]">
                    Phone
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[140px]">
                    Total Limit
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[160px]">
                    Available Limit
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[120px]">
                    Status
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[140px]">
                    Last Active
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[170px]">
                    Cardholder Name
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[200px]">
                    Card Number
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[120px]">
                    Expiry
                  </th>
                  <th className="text-left py-5 px-8 font-semibold text-foreground min-w-[100px]">
                    CVV
                  </th>
                  <th className="text-center py-5 px-8 font-semibold text-foreground min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                      index % 2 === 0 ? "bg-slate-900 bg-opacity-20" : ""
                    }`}
                  >
                    <td className="py-5 px-8 sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent bg-opacity-20 rounded-full flex items-center justify-center">
                          <span className="text-accent font-semibold text-sm">
                            {customer.full_name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {customer.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-8 text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="py-5 px-8 text-muted-foreground">
                      {customer.phone_number}
                    </td>
                    <td className="py-5 px-8">
                      <span className="font-semibold text-foreground">
                        ${customer.total_limit.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <span className="font-semibold text-green-400">
                        ${customer.available_limit.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          customer.is_active
                            ? "bg-green-950 bg-opacity-30 text-green-400"
                            : "bg-gray-900 bg-opacity-30 text-gray-400"
                        }`}
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-muted-foreground text-sm">
                      {new Date(customer.last_active).toLocaleDateString()}
                    </td>
                    <td className="py-5 px-8 text-muted-foreground">
                      {customer.cardholder_name || "-"}
                    </td>
                    <td className="py-5 px-8 font-mono text-muted-foreground">
                      {customer.card_number || "-"}
                    </td>
                    <td className="py-5 px-8 text-muted-foreground">
                      {customer.expiry_date || "-"}
                    </td>
                    <td className="py-5 px-8 text-muted-foreground">
                      {customer.cvv || "-"}
                    </td>
                    <td className="py-5 px-8 text-center">
                      <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors inline-flex">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && customers.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No customers found matching your search
              </p>
            </div>
          )}

          {customers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No customers available
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}