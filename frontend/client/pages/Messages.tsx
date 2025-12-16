import { Search, Plus, Mail, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useState } from 'react';

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const messages = [
    {
      id: '1',
      customerName: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      subject: 'Account Inquiry',
      preview: 'Hi, I have a question about my account balance...',
      content: 'Hi, I have a question about my account balance and the recent transaction that appeared. Could you please help me understand these charges?',
      timestamp: '2024-12-15 10:30 AM',
      read: false,
      priority: 'high',
    },
    {
      id: '2',
      customerName: 'Bob Smith',
      customerEmail: 'bob@example.com',
      subject: 'Verification Process',
      preview: 'Need help with account verification process...',
      content: 'Hi, I\'m trying to complete my account verification but I\'m having trouble with the phone verification step. Can you guide me through this?',
      timestamp: '2024-12-15 09:15 AM',
      read: false,
      priority: 'normal',
    },
    {
      id: '3',
      customerName: 'Carol Davis',
      customerEmail: 'carol@example.com',
      subject: 'Payment Issue',
      preview: 'My payment keeps getting declined...',
      content: 'I\'ve tried making a payment three times now, but my card keeps getting declined. The card works fine at other places. What could be wrong?',
      timestamp: '2024-12-15 08:45 AM',
      read: true,
      priority: 'high',
    },
    {
      id: '4',
      customerName: 'David Wilson',
      customerEmail: 'david@example.com',
      subject: 'Feature Request',
      preview: 'Would love to see a mobile app...',
      content: 'Great service overall! I was wondering if you have plans for a mobile app in the future? It would make managing my account on the go much easier.',
      timestamp: '2024-12-14 04:20 PM',
      read: true,
      priority: 'normal',
    },
    {
      id: '5',
      customerName: 'Emma Brown',
      customerEmail: 'emma@example.com',
      subject: 'Scheduled Transfer',
      preview: 'How do I set up automated transfers?...',
      content: 'I\'d like to set up automated monthly transfers to my savings account. Can you explain how to do this in the system?',
      timestamp: '2024-12-14 02:10 PM',
      read: true,
      priority: 'normal',
    },
    {
      id: '6',
      customerName: 'Frank Miller',
      customerEmail: 'frank@example.com',
      subject: 'Security Concern',
      preview: 'Suspicious activity on my account...',
      content: 'I noticed some unusual login attempts on my account last night. I\'ve changed my password, but I wanted to alert you. Should I be concerned?',
      timestamp: '2024-12-14 11:30 AM',
      read: true,
      priority: 'high',
    },
  ];

  const filteredMessages = messages.filter(
    (msg) =>
      msg.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMsg = selectedMessage
    ? messages.find((m) => m.id === selectedMessage)
    : null;

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Messages</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
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
              placeholder="Search messages by customer or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12"
            />
          </div>
        </div>

        {/* Messages Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="max-h-96 lg:max-h-full overflow-y-auto">
                {filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg.id)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-slate-800 hover:bg-opacity-50 transition-colors ${
                      selectedMessage === msg.id
                        ? 'bg-blue-950 bg-opacity-30 border-l-2 border-l-primary'
                        : ''
                    } ${!msg.read ? 'bg-slate-800 bg-opacity-20' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Mail className={`w-4 h-4 mt-1 flex-shrink-0 ${!msg.read ? 'text-blue-400' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${!msg.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {msg.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredMessages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No messages found</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMsg ? (
              <div className="bg-card border border-border rounded-lg p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{selectedMsg.subject}</h2>
                    <div className="space-y-1">
                      <p className="text-foreground font-semibold">{selectedMsg.customerName}</p>
                      <p className="text-muted-foreground text-sm">{selectedMsg.customerEmail}</p>
                      <p className="text-muted-foreground text-xs mt-2">{selectedMsg.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedMsg.priority === 'high'
                          ? 'bg-red-950 bg-opacity-30 text-red-400'
                          : 'bg-blue-950 bg-opacity-30 text-blue-400'
                      }`}
                    >
                      {selectedMsg.priority}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-8">
                  <p className="text-foreground leading-relaxed">{selectedMsg.content}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    Reply
                  </button>
                  <button className="px-4 py-2 bg-red-950 bg-opacity-20 text-red-400 rounded-lg font-semibold hover:bg-red-950 hover:bg-opacity-40 transition-colors flex items-center gap-2 justify-center">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No message selected</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Choose a message from the list to view its contents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
