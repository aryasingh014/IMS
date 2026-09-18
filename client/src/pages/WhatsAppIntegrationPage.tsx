import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, X, Clock } from 'lucide-react';
import { api } from '../services/api';
import { WhatsAppMessage } from '../types';
import { useApp } from '../context/AppContext';

export const WhatsAppIntegrationPage: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, refreshSummary } = useApp();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.getPendingWhatsAppUpdates();
      setMessages(res.pendingMessages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveWhatsAppUpdate(id);
      showToast('WhatsApp update applied to intern record!');
      fetchMessages();
      refreshSummary();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Pending WhatsApp Queue...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Webhook Pending Queue</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Parsed incoming WhatsApp daily progress messages requiring admin approval.
        </p>
      </div>

      <div className="space-y-3 max-w-3xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-bold text-slate-900 text-xs">{msg.senderPhone}</span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">
                  {msg.receivedAt ? new Date(msg.receivedAt).toLocaleString() : 'Just now'}
                </span>
              </div>
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                PENDING APPROVAL
              </span>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl font-mono">"{msg.rawMessage}"</p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleApprove(msg.id)}
                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" /> Approve & Apply Update
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
