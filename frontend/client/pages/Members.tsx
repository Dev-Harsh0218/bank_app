import { Search, Plus, Users, Clock, CheckCircle, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPendingUsers,
  getAllMembers,
  PendingUser,
  approveUser,
  rejectUser,
} from "@/services/members";
import { toast } from "@/components/ui/use-toast";

export default function Members() {
  const { getTokens, updateTokens, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allMembers, setAllMembers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{
    [userId: string]: "approve" | "reject" | null;
  }>({});

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
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch pending users";
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

  useEffect(() => {
    const fetchAllMembers = async () => {
      if (!getTokens || activeTab !== "all") return;

      try {
        setIsLoadingAll(true);
        const response = await getAllMembers(getTokens, updateTokens, logout);
        setAllMembers(response.data.users);
      } catch (err) {
        console.error("Failed to fetch all members:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch all members";
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      } finally {
        setIsLoadingAll(false);
      }
    };

    fetchAllMembers();
  }, [activeTab, getTokens, updateTokens, logout]);

  const handleApprove = async (userId: string, username: string) => {
    if (!getTokens) return;

    setActionLoading((prev) => ({ ...prev, [userId]: "approve" }));

    try {
      await approveUser(userId, getTokens, updateTokens, logout);

      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
      setAllMembers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_approved: true } : user,
        ),
      );

      toast({
        title: "User Approved",
        description: `${username} has been approved and can now access the system.`,
      });
    } catch (err) {
      console.error("Failed to approve user:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to approve user";
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: errorMessage,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  const handleReject = async (userId: string, username: string) => {
    if (!getTokens) return;

    setActionLoading((prev) => ({ ...prev, [userId]: "reject" }));

    try {
      await rejectUser(userId, getTokens, updateTokens, logout);

      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
      setAllMembers((prev) => prev.filter((user) => user.id !== userId));

      toast({
        title: "User Rejected",
        description: `${username}'s application has been rejected.`,
      });
    } catch (err) {
      console.error("Failed to reject user:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reject user";
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: errorMessage,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  const filteredPendingUsers = pendingUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredAllMembers = allMembers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPending = pendingUsers.length;
  const activePending = pendingUsers.filter((u) => u.is_active).length;
  const totalMembers = allMembers.length;
  const approvedMembers = allMembers.filter((u) => u.is_approved).length;

  const getStatusBadge = (user: PendingUser) => {
    if (!user.is_approved) {
      return (
        <span className="px-3 py-1 bg-orange-950 bg-opacity-30 text-orange-400 rounded-full text-xs font-semibold">
          Pending Approval
        </span>
      );
    }
    if (user.is_active) {
      return (
        <span className="px-3 py-1 bg-green-950 bg-opacity-30 text-green-400 rounded-full text-xs font-semibold">
          Active
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-gray-900 bg-opacity-30 text-gray-400 rounded-full text-xs font-semibold">
        Inactive
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                Members
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage and review all members
              </p>
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
                  {activeTab === "all" ? totalMembers : "-"}
                </p>
              </div>
              <div className="p-2 bg-blue-950 bg-opacity-30 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "all"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Members ({activeTab === "all" ? totalMembers : "..."})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "pending"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Approvals ({totalPending})
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "pending" ? "pending users" : "members"} by username or email...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12"
            />
          </div>
        </div>

        {/* Tables */}
        {activeTab === "pending" ? (
          /* Pending Users Table */
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading pending approvals...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">
                  Failed to load pending approvals
                </p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
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
                      {filteredPendingUsers.map((user, index) => (
                        <tr
                          key={user.id}
                          className={`border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                            index % 2 === 0 ? "bg-slate-900 bg-opacity-20" : ""
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
                                <span className="font-semibold text-foreground">
                                  {user.username}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  ID: {user.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground hidden sm:table-cell">
                            {user.email}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 bg-gray-950 bg-opacity-30 text-gray-400 rounded-full text-xs font-semibold">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground hidden md:table-cell">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">{getStatusBadge(user)}</td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() =>
                                  handleApprove(user.id, user.username)
                                }
                                disabled={actionLoading[user.id] === "approve"}
                                className="px-3 py-1 bg-green-950 bg-opacity-30 text-green-400 rounded text-xs font-semibold hover:bg-opacity-50 transition-colors min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                {actionLoading[user.id] === "approve" ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Approving...</span>
                                  </>
                                ) : (
                                  "Approve"
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleReject(user.id, user.username)
                                }
                                disabled={actionLoading[user.id] === "reject"}
                                className="px-3 py-1 bg-red-950 bg-opacity-30 text-red-400 rounded text-xs font-semibold hover:bg-opacity-50 transition-colors min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                {actionLoading[user.id] === "reject" ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Rejecting...</span>
                                  </>
                                ) : (
                                  "Reject"
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPendingUsers.length === 0 &&
                  pendingUsers.length > 0 && (
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
              </>
            )}
          </div>
        ) : (
          /* All Members Table */
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoadingAll ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading all members...
                  </p>
                </div>
              </div>
            ) : (
              <>
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
                          Joined Date
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground min-w-[120px]">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground min-w-[140px] hidden md:table-cell">
                          Last Login
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllMembers.map((user, index) => (
                        <tr
                          key={user.id}
                          className={`border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                            index % 2 === 0 ? "bg-slate-900 bg-opacity-20" : ""
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  user.is_approved && user.is_active
                                    ? "bg-green-950 bg-opacity-20"
                                    : !user.is_approved
                                      ? "bg-orange-950 bg-opacity-20"
                                      : "bg-gray-900 bg-opacity-20"
                                }`}
                              >
                                <span
                                  className={`font-semibold text-sm ${
                                    user.is_approved && user.is_active
                                      ? "text-green-400"
                                      : !user.is_approved
                                        ? "text-orange-400"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-foreground">
                                  {user.username}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  ID: {user.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground hidden sm:table-cell">
                            {user.email}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 bg-gray-950 bg-opacity-30 text-gray-400 rounded-full text-xs font-semibold">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground hidden md:table-cell">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">{getStatusBadge(user)}</td>
                          <td className="py-4 px-6 text-muted-foreground hidden md:table-cell">
                            {user.last_login &&
                            user.last_login !== "0001-01-01T00:00:00Z"
                              ? new Date(user.last_login).toLocaleDateString()
                              : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAllMembers.length === 0 && allMembers.length > 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No members found matching your search
                    </p>
                  </div>
                )}
                {allMembers.length === 0 && !isLoadingAll && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No members found
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
