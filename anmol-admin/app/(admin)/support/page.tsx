'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, Badge, Spinner, Button, Input } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { MessageSquare, CheckCircle, Clock, Send, User } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: tickets, isLoading, refetch } = trpc.ticket.getTickets.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10s for new messages
  });

  const { data: ticketDetails, isLoading: isLoadingDetails } = trpc.ticket.getTicketDetails.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: !!selectedTicketId, refetchInterval: 5000 }
  );

  const replyMutation = trpc.ticket.replyToTicket.useMutation({
    onSuccess: () => {
      setReplyText('');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleReply = (close: boolean = false) => {
    if (!selectedTicketId || (!replyText.trim() && !close)) return;
    replyMutation.mutate({
      ticketId: selectedTicketId,
      text: replyText,
      closeTicket: close,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">In Progress</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Resolved</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="pb-12 h-[calc(100vh-2rem)] flex flex-col">
      <PageHeader 
        title="Support Tickets" 
        description="Manage customer complaints escalated by the AI Chatbot." 
      />

      <div className="flex flex-1 gap-6 mt-6 overflow-hidden">
        {/* Ticket List */}
        <div className="w-1/3 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-violet-600" />
              Recent Tickets
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-8"><Spinner /></div>
            ) : tickets?.length === 0 ? (
              <p className="text-center text-slate-500 text-sm p-4">No tickets found.</p>
            ) : (
              tickets?.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTicketId === t.id 
                      ? 'border-violet-300 bg-violet-50/50 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-900 truncate pr-2">
                      {t.user.name || t.user.phone || 'Unknown'}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1 mb-2">
                    {t.subject || 'No subject'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(t.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{t._count.messages} messages</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Thread */}
        <div className="flex-1 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm relative">
          {!selectedTicketId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Select a ticket to view the conversation</p>
            </div>
          ) : isLoadingDetails ? (
            <div className="flex-1 flex items-center justify-center"><Spinner size={32} /></div>
          ) : ticketDetails ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center z-10 shadow-sm">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{ticketDetails.user.name || ticketDetails.user.phone}</h3>
                  <p className="text-sm text-slate-500">Subject: {ticketDetails.subject}</p>
                </div>
                {ticketDetails.status !== 'RESOLVED' && (
                  <Button 
                    variant="outline" 
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => handleReply(true)}
                    disabled={replyMutation.isPending}
                  >
                    <CheckCircle size={16} className="mr-2" /> Mark as Resolved
                  </Button>
                )}
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
                {ticketDetails.messages.map((msg, idx) => {
                  const isAdmin = msg.sender === 'HUMAN';
                  const isAi = msg.sender === 'AI';
                  
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[70%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isAdmin ? 'bg-violet-100 text-violet-700' : 
                          isAi ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isAdmin ? <User size={16} /> : isAi ? <span className="text-[10px] font-bold">AI</span> : <User size={16} />}
                        </div>
                        <div className={`p-3 rounded-2xl ${
                          isAdmin 
                            ? 'bg-violet-600 text-white rounded-tr-none shadow-sm' 
                            : isAi 
                              ? 'bg-orange-50 border border-orange-100 text-slate-700 rounded-tl-none' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <span className={`text-[10px] mt-1 block opacity-70 ${isAdmin ? 'text-violet-200 text-right' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              {ticketDetails.status !== 'RESOLVED' ? (
                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a reply... (This will be sent via WhatsApp)" 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleReply()} 
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {replyMutation.isPending ? <Spinner size={16} /> : <Send size={16} />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-slate-500 text-sm">
                  This ticket has been resolved and closed.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
