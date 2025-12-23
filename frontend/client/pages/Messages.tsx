import { Search, Plus, Mail, Trash2, User, Star, StarOff } from "lucide-react";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  getMessagesByCustomer,
  type Message 
} from '@/services/messages';
import { getCustomers, type Customer as CustomerType } from '@/services/customer';
import { toast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';

export default function Messages() {
  const { getTokens, updateTokens, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const customerId = searchParams.get('customer');
    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        handleCustomerSelect(customer);
        setSearchParams({});
      }
    }
  }, [searchParams, customers, setSearchParams]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCustomers(getTokens, updateTokens, logout);
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
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

  const handleCustomerSelect = async (customer: CustomerType) => {
    setSelectedCustomer(customer);
    setSelectedMessage(null);
    await loadCustomerMessages(customer.id);
  };

  const loadCustomerMessages = async (customerId: string, page: number = 1) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const response = await getMessagesByCustomer(customerId, page, 50, getTokens, updateTokens, logout);
      
      const enrichedMessages = response.data.messages.map(msg => ({
        ...msg,
        customerName: selectedCustomer?.full_name || 'Customer',
        customerEmail: selectedCustomer?.email || 'customer@example.com',
        subject: `Message ${msg.id.slice(0, 8)}`,
        preview: msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content,
        read: false,
        priority: 'normal' as const
      }));
      
      if (page === 1) {
        setMessages(enrichedMessages);
      } else {
        setMessages(prev => [...prev, ...enrichedMessages]);
      }
      
      setHasMore(response.data.pagination.has_more);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch customer messages:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer messages';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMoreMessages = () => {
    if (selectedCustomer) {
      loadCustomerMessages(selectedCustomer.id, currentPage + 1);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_number.includes(searchQuery)
  );

  const selectedMsg = selectedMessage
    ? messages.find((m) => m.id === selectedMessage)
    : null;

  const unreadCount = messages.filter((m) => !m.read).length;

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

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
                onClick={loadCustomers}
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
                Messages
                {selectedCustomer && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    - {selectedCustomer.full_name}
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {selectedCustomer 
                  ? `${messages.length} message${messages.length !== 1 ? 's' : ''} from ${selectedCustomer.full_name}`
                  : 'Select a customer to view their messages'
                }
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
              <Plus className="w-5 h-5" />
              Compose
            </button>
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

        {/* Messages Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customers List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="max-h-96 lg:max-h-full overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? "bg-blue-950 bg-opacity-30 border-l-2 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <User
                        className={`w-4 h-4 mt-1 flex-shrink-0 ${selectedCustomer?.id === customer.id ? "text-blue-400" : "text-muted-foreground"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold truncate ${selectedCustomer?.id === customer.id ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {customer.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              customer.is_active
                                ? "bg-green-950 bg-opacity-30 text-green-400"
                                : "bg-gray-900 bg-opacity-30 text-gray-400"
                            }`}
                          >
                            {customer.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="text-xs text-accent font-semibold">
                            {customer.message_count} msg{customer.message_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredCustomers.length === 0 && customers.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    No customers found
                  </p>
                </div>
              )}

              {customers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    No customers available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedCustomer ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Messages List */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {isLoadingMessages && messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-xs text-muted-foreground">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">No messages from this customer</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <button
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg.id)}
                            className={`w-full text-left p-3 border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                              selectedMessage === msg.id
                                ? 'bg-blue-950 bg-opacity-30 border-l-2 border-l-primary'
                                : ''
                            } ${!msg.read ? 'bg-slate-800 bg-opacity-20' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <Mail className={`w-3 h-3 mt-1 flex-shrink-0 ${!msg.read ? 'text-blue-400' : 'text-muted-foreground'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm truncate ${!msg.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {msg.subject}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{msg.preview}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-muted-foreground">{formatTimestamp(msg.timestamp)}</p>
                                  <div className="flex items-center gap-1">
                                    {msg.starred && <Star className="w-2 h-2 text-yellow-400" />}
                                    <span
                                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                                        msg.priority === 'high'
                                          ? 'bg-red-950 bg-opacity-30 text-red-400'
                                          : msg.priority === 'normal'
                                          ? 'bg-blue-950 bg-opacity-30 text-blue-400'
                                          : 'bg-gray-950 bg-opacity-30 text-gray-400'
                                      }`}
                                    >
                                      {msg.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}

                        {/* Load More Button */}
                        {hasMore && (
                          <div className="p-3 border-t border-border">
                            <button
                              onClick={loadMoreMessages}
                              disabled={isLoadingMessages}
                              className="w-full py-2 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors disabled:opacity-50 text-sm"
                            >
                              {isLoadingMessages ? 'Loading...' : 'Load More'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Message Detail */}
                <div>
                  {selectedMsg ? (
                    <div className="bg-card border border-border rounded-lg p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">{selectedMsg.subject}</h3>
                          <p className="text-muted-foreground text-xs">{formatTimestamp(selectedMsg.timestamp)}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {selectedMsg.starred && <Star className="w-4 h-4 text-yellow-400" />}
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              selectedMsg.priority === 'high'
                                ? 'bg-red-950 bg-opacity-30 text-red-400'
                                : selectedMsg.priority === 'normal'
                                ? 'bg-blue-950 bg-opacity-30 text-blue-400'
                                : 'bg-gray-950 bg-opacity-30 text-gray-400'
                            }`}
                          >
                            {selectedMsg.priority}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <p className="text-foreground text-sm leading-relaxed">{selectedMsg.content}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <button className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm">
                          Reply
                        </button>
                        <button className="px-3 py-1.5 bg-yellow-950 bg-opacity-20 text-yellow-400 rounded-lg font-semibold hover:bg-yellow-950 hover:bg-opacity-40 transition-colors text-sm">
                          {selectedMsg.starred ? 'Unstar' : 'Star'}
                        </button>
                        <button className="px-3 py-1.5 bg-red-950 bg-opacity-20 text-red-400 rounded-lg font-semibold hover:bg-red-950 hover:bg-opacity-40 transition-colors text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                      <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground text-sm">Select a message to view details</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No customer selected</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Click on a customer from the list to view their messages
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}