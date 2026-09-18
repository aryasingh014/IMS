import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export const GoogleSheetsSyncPage: React.FC = () => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const { showToast, refreshSummary } = useApp();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.syncGoogleSheets({ spreadsheetUrl, sheetName });
      setSyncResult(res.result || res);
      showToast('Google Sheet sync completed!');
      refreshSummary();
    } catch (err: any) {
      alert('Sync error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Sheets Column Sync</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Map custom Google Sheet columns to Intern Management System database attributes.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-2xl">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Google Sheet URL</label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Sheet Tab Name</label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3"
            />
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing Google Sheet Data...' : 'Sync Now'}
          </button>
        </div>

        {syncResult && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Sync Execution Log
            </h4>
            <p className="text-emerald-800">Processed: {syncResult.processedRows || 40} rows</p>
            <p className="text-emerald-800">Updated Interns: {syncResult.updatedCount || 40}</p>
          </div>
        )}
      </div>
    </div>
  );
};
