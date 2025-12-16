import { Search, Plus, MoreVertical } from 'lucide-react';
import Layout from '@/components/Layout';
import { useState } from 'react';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');

  const members = [
    {
      id: '1',
      name: 'Sarah Anderson',
      email: 'sarah@example.com',
      role: 'Admin',
      joinDate: '2024-01-15',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@example.com',
      role: 'Member',
      joinDate: '2024-02-20',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      role: 'Member',
      joinDate: '2024-03-10',
      status: 'Active',
    },
    {
      id: '4',
      name: 'James Wilson',
      email: 'james@example.com',
      role: 'Admin',
      joinDate: '2024-01-05',
      status: 'Active',
    },
    {
      id: '5',
      name: 'Lisa Park',
      email: 'lisa@example.com',
      role: 'Member',
      joinDate: '2024-02-28',
      status: 'Inactive',
    },
    {
      id: '6',
      name: 'David Thompson',
      email: 'david@example.com',
      role: 'Member',
      joinDate: '2024-03-15',
      status: 'Active',
    },
  ];

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Members</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage your team members and their access</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
              <Plus className="w-5 h-5" />
              Add Member
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-800 bg-opacity-50">
                  <th className="text-left py-3 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base text-foreground">Name</th>
                  <th className="text-left py-3 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base text-foreground hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base text-foreground">Role</th>
                  <th className="text-left py-3 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base text-foreground hidden md:table-cell">Join Date</th>
                  <th className="text-left py-3 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base text-foreground">Status</th>
                  <th className="text-center py-3 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className={`border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900 bg-opacity-20' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{member.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-blue-950 bg-opacity-30 text-blue-400 rounded-full text-xs font-semibold">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{member.joinDate}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          member.status === 'Active'
                            ? 'bg-green-950 bg-opacity-30 text-green-400'
                            : 'bg-gray-900 bg-opacity-30 text-gray-400'
                        }`}
                      >
                        {member.status}
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

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No members found</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Members</p>
            <p className="text-2xl font-bold text-foreground">{members.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-green-400">{members.filter(m => m.status === 'Active').length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Admins</p>
            <p className="text-2xl font-bold text-blue-400">{members.filter(m => m.role === 'Admin').length}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
