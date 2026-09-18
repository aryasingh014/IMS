import React, { useState } from 'react';
import { AlertCircle, X, Check } from 'lucide-react';

interface BlockerReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  taskTitle?: string;
}

export const BlockerReasonModal: React.FC<BlockerReasonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory explanation of what is blocking this task.');
      return;
    }
    setError('');
    onSubmit(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-rose-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Mandatory Blocker Explanation</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            You are changing status to <strong className="text-rose-600 font-bold">Blocked</strong>.
            Please describe the exact technical bottleneck or dependency blocking progress:
          </p>

          {taskTitle && (
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 font-medium">
              Task: {taskTitle}
            </div>
          )}

          <div>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              placeholder="e.g. Waiting on backend API key credentials / database schema migration..."
              className="w-full bg-white border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400"
            />
            {error && <p className="text-[11px] font-semibold text-rose-600 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Submit Blocker Reason
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
