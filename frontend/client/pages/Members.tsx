import { Search, Plus, MoreVertical, Users, Clock, CheckCircle, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPendingUsers, PendingUser, approveUser, rejectUser } from '@/services/members';
import { toast } from '@/components/ui/use-toast';

export default function Members() {
  const { getTokens, updateTokens, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [userId: string]: 'approve' | 'reject' | null }>({});

  useEffect(() => {
    const fetchPendingUsers = async () => {
      if (!getTokens) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await getPendingUsers(getTokens, updateTokens, logout);
        setPendingUsers(response.data.users);
      } catch (err) {
        console.error("Failed to fetch pending users:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch pending users";
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

    fetchPendingUsers();
  }, [getTokens, updateTokens, logout]);

  const handleApprove = async (userId: string, username: string) => {
    if (!getTokens) return;

    setActionLoading(prev => ({ ...prev, [userId]: 'approve' }));

    try {
      await approveUser(userId, getTokens, updateTokens, logout);
      
      // Remove the user from the pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User Approved",
        description: `${username} has been approved and can now access the system.`,
      });
    } catch (err) {
      console.error("Failed to approve user:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to approve user";
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: errorMessage,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleReject = async (userId: string, username: string) => {
    if (!getTokens) return;

    setActionLoading(prev => ({ ...prev, [userId]: 'reject' }));

    try {
      await rejectUser(userId, getTokens, updateTokens, logout);
      
      // Remove the user from the pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User Rejected",
        description: `${username}'s application has been rejected.`,
      });
    } catch (err) {
      console.error("Failed to reject user:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to reject user";
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: errorMessage,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const filteredUsers = pendingUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals for stats
  const totalPending = pendingUsers.length;
  const activePending = pendingUsers.filter((u) => u.is_active).length;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-3 sm:p-4 md:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pending approvals...</p>
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
              <p className="text-red-400 mb-4">Failed to load pending approvals</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Members</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Review and approve pending member applications</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
              <Plus className="w-5 h-5" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalPending}
                </p>
              </div>
              <div className="p-2 bg-orange-950 bg-opacity-30 rounded-lg">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Pending
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activePending}
                </p>
              </div>
              <div className="p-2 bg-green-950 bg-opacity-30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {/* This would need another API call to get total approved members */}
                  -
                </p>
              </div>
              <div className="p-2 bg-blue-950 bg-opacity-30 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
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
              placeholder="Search pending users by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12"
            />
          </div>
        </div>

        {/* Pending Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent px-2 sm:px-4">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-slate-800 bg-opacity-50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground min-w-[200px]">
                    Username
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground min-w-[250px] hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground min-w-[120px]">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground min-w-[140px] hidden md:table-cell">
                    Applied Date
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground min-w-[120px]">
                    Status
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900 bg-opacity-20' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-950 bg-opacity-20 rounded-full flex items-center justify-center">
                          <span className="text-orange-400 font-semibold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">{user.username}</span>
                          <div className="text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-gray-950 bg-opacity-30 text-gray-400 rounded-full text-xs font-semibold">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-orange-950 bg-opacity-30 text-orange-400 rounded-full text-xs font-semibold">
                        Pending Approval
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col gap-2 items-center">
                        <button 
                          onClick={() => handleApprove(user.id, user.username)}
                          disabled={actionLoading[user.id] === 'approve'}
                          className="px-3 py-1 bg-green-950 bg-opacity-30 text-green-400 rounded text-xs font-semibold hover:bg-opacity-50 transition-colors min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {actionLoading[user.id] === 'approve' ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            'Approve'
                          )}
                        </button>
                        <button 
                          onClick={() => handleReject(user.id, user.username)}
                          disabled={actionLoading[user.id] === 'reject'}
                          className="px-3 py-1 bg-red-950 bg-opacity-30 text-red-400 rounded text-xs font-semibold hover:bg-opacity-50 transition-colors min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {actionLoading[user.id] === 'reject' ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Rejecting...</span>
                            </>
                          ) : (
                            'Reject'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && pendingUsers.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No pending users found matching your search
              </p>
            </div>
          )}

          {pendingUsers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No pending approvals
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                All member applications have been processed
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}