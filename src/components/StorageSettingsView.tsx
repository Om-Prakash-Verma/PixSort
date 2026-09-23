import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Server,
  Cloud,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectedDriveAccount } from '../types.js';

interface StorageSettingsViewProps {
  onNotify?: (msg: string) => void;
  onAccountsUpdated?: () => void;
}

export const StorageSettingsView: React.FC<StorageSettingsViewProps> = ({
  onNotify,
  onAccountsUpdated,
}) => {
  const [accounts, setAccounts] = useState<ConnectedDriveAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  // Connect modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customQuotaGb, setCustomQuotaGb] = useState('15');
  const [customUsedGb, setCustomUsedGb] = useState('1.5');
  const [isConnecting, setIsConnecting] = useState(false);

  // Disconnect warning modal state (Section 15 requirement)
  const [accountToDisconnect, setAccountToDisconnect] = useState<ConnectedDriveAccount | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drive/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to load drive accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit <= 0) return 0;
    const pct = (used / limit) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  };

  // Reorder priorities (Section 8)
  const handleMovePriority = async (index: number, direction: 'up' | 'down') => {
    const newAccounts = [...accounts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newAccounts.length) return;

    const temp = newAccounts[index];
    newAccounts[index] = newAccounts[targetIndex];
    newAccounts[targetIndex] = temp;

    setAccounts(newAccounts);

    try {
      const res = await fetch('/api/drive/accounts/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: newAccounts.map((a) => a.id) }),
      });
      if (res.ok) {
        onNotify?.('Storage priority updated');
        onAccountsUpdated?.();
      }
    } catch (err) {
      console.error('Priority update error:', err);
      fetchAccounts();
    }
  };

  // Disconnect confirmation
  const handleConfirmDisconnect = async () => {
    if (!accountToDisconnect) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch(`/api/drive/accounts/${accountToDisconnect.id}/disconnect`, {
        method: 'POST',
      });
      if (res.ok) {
        onNotify?.(`Disconnected ${accountToDisconnect.googleAccountEmail}. Files preserved.`);
        setAccountToDisconnect(null);
        await fetchAccounts();
        onAccountsUpdated?.();
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Reconnect account
  const handleReconnect = async (account: ConnectedDriveAccount) => {
    try {
      const res = await fetch(`/api/drive/accounts/${account.id}/reconnect`, {
        method: 'POST',
      });
      if (res.ok) {
        onNotify?.(`Reconnected ${account.googleAccountEmail}`);
        await fetchAccounts();
        onAccountsUpdated?.();
      }
    } catch (err) {
      console.error('Reconnect error:', err);
    }
  };

  // Fresh quota check from Drive API
  const handleRefreshStats = async (account: ConnectedDriveAccount) => {
    setRefreshingId(account.id);
    try {
      const res = await fetch(`/api/drive/accounts/${account.id}/stats`);
      if (res.ok) {
        await fetchAccounts();
        onNotify?.(`Quota refreshed for ${account.googleAccountEmail}`);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshingId(null);
    }
  };

  // Connect new account (Section 2)
  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    setIsConnecting(true);
    try {
      const res = await fetch('/api/drive/accounts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customEmail.trim(),
          storageLimitGb: parseFloat(customQuotaGb) || 15,
          storageUsedGb: parseFloat(customUsedGb) || 1.5,
        }),
      });

      if (res.ok) {
        onNotify?.(`Connected Google Drive account: ${customEmail}`);
        setShowConnectModal(false);
        setCustomEmail('');
        await fetchAccounts();
        onAccountsUpdated?.();
      }
    } catch (err) {
      console.error('Connect account error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Real Google OAuth trigger
  const handleStartOAuth = async () => {
    try {
      const res = await fetch('/api/drive/oauth/url');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('OAuth redirect error:', err);
    }
  };

  const totalPoolLimit = accounts.filter((a) => a.status === 'active').reduce((acc, a) => acc + a.storageLimit, 0);
  const totalPoolUsed = accounts.filter((a) => a.status === 'active').reduce((acc, a) => acc + a.storageUsed, 0);
  const totalPoolPct = getUsagePercentage(totalPoolUsed, totalPoolLimit);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            <span>Connected Storage</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            Google Drive Storage
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your photos are stored in your own Google Drive accounts.
          </p>
        </div>

        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neo-btn text-xs font-bold text-blue-700 hover:text-blue-900 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>+ Connect Google Drive</span>
        </button>
      </div>

      {/* Failover & Automatic Allocation Banner (Section 5 & 17) */}
      <div className="p-4 rounded-2xl neo-inset border border-white/60 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl neo-raised flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800">
              Automatic Storage Failover & Allocation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Storage automatically switches to your next connected Drive when the current Drive runs out of space.
              All connected accounts are pooled together into one seamless, unified photo library.
            </p>
          </div>
        </div>

        {/* Aggregate Storage Progress Bar */}
        <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Total Pooled Storage:</span>
            <span className="font-mono text-slate-900 font-bold">
              {formatBytes(totalPoolUsed)} / {formatBytes(totalPoolLimit)} used
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {totalPoolPct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {accounts.filter((a) => a.status === 'active').length} Active Drive Accounts Pooled
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Connected Accounts ({accounts.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Order determines priority for new photo uploads
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading connected Drive accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 rounded-2xl neo-raised text-center space-y-3">
            <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No Google Drive accounts connected yet</p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 rounded-xl neo-btn text-xs font-bold text-blue-700"
            >
              + Connect Google Drive
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc, index) => {
              const pct = getUsagePercentage(acc.storageUsed, acc.storageLimit);
              const isActive = acc.status === 'active';
              const isFull = pct >= 95;

              return (
                <div
                  key={acc.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isActive
                      ? 'neo-raised bg-[#EEF2F6] border-white/80'
                      : 'opacity-70 bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Account Identity & Status */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMovePriority(index, 'up')}
                          className={`p-1 rounded-lg neo-btn transition-colors ${
                            index === 0
                              ? 'opacity-30 cursor-not-allowed text-slate-300'
                              : 'text-slate-600 hover:text-blue-600'
                          }`}
                          title="Increase Priority (Move Up)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          #{acc.priority}
                        </span>
                        <button
                          disabled={index === accounts.length - 1}
                          onClick={() => handleMovePriority(index, 'down')}
                          className={`p-1 rounded-lg neo-btn transition-colors ${
                            index === accounts.length - 1
                              ? 'opacity-30 cursor-not-allowed text-slate-300'
                              : 'text-slate-600 hover:text-blue-600'
                          }`}
                          title="Decrease Priority (Move Down)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isActive ? (isFull ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500') : 'bg-slate-400'
                          }`} />
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            {acc.googleAccountEmail}
                          </span>
                          {index === 0 && isActive && (
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>Status: <strong className={isActive ? 'text-emerald-700' : 'text-slate-500'}>
                            {isActive ? 'Active' : 'Disconnected'}
                          </strong></span>
                          <span>•</span>
                          <span>Photos: <strong className="text-slate-800 font-mono">{acc.photoCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRefreshStats(acc)}
                        disabled={refreshingId === acc.id}
                        className="p-2 rounded-xl neo-btn text-slate-600 hover:text-blue-600 transition-colors"
                        title="Check Fresh Quota from Google Drive API"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === acc.id ? 'animate-spin text-blue-600' : ''}`} />
                      </button>

                      {isActive ? (
                        <button
                          onClick={() => setAccountToDisconnect(acc)}
                          className="px-3 py-1.5 rounded-xl neo-btn text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReconnect(acc)}
                          className="px-3 py-1.5 rounded-xl neo-btn text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reconnect</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Storage Bar (Section 3 & 17) */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 font-medium">
                        {formatBytes(acc.storageUsed)} / {formatBytes(acc.storageLimit)} used
                      </span>
                      <span className={`font-bold ${isFull ? 'text-amber-700' : 'text-slate-700'}`}>
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full neo-inset bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 95
                            ? 'bg-rose-500'
                            : pct >= 80
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>Available: {formatBytes(acc.storageAvailable)}</span>
                      <span>Folder: AI Photo Search/Photos/</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => setShowConnectModal(true)}
            className="w-full py-3 rounded-2xl neo-btn text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center justify-center gap-2 border border-slate-200/50 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>+ Connect Another Google Drive</span>
          </button>
        </div>
      </div>

      {/* Disconnect Warning Modal (Section 15 requirement) */}
      <AnimatePresence>
        {accountToDisconnect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-4 border border-white/80"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Disconnect Google Drive?</h3>
                  <p className="text-xs text-slate-500 font-mono">{accountToDisconnect.googleAccountEmail}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl neo-inset bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold">
                  Photos currently stored in this Google Drive account will no longer be accessible to this application after disconnecting.
                </p>
                <div className="mt-2 pt-2 border-t border-amber-200/40 font-mono text-[11px] space-y-0.5">
                  <div>This account currently contains:</div>
                  <div className="font-bold text-slate-800">
                    {accountToDisconnect.photoCount} photos • {formatBytes(accountToDisconnect.storageUsed)}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                <em>Note:</em> Your original photo files will remain completely safe inside your personal Google Drive and will NOT be deleted.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  disabled={isDisconnecting}
                  onClick={() => setAccountToDisconnect(null)}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isDisconnecting}
                  onClick={handleConfirmDisconnect}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Connect Account Modal (Section 2 & 16) */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-5 border border-white/80"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl neo-raised flex items-center justify-center text-blue-600">
                    <Cloud className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Connect Google Drive</h3>
                    <p className="text-xs text-slate-500">
                      Pool storage across your personal Google accounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="p-1.5 rounded-xl neo-btn text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Option 1: Direct Personal Account Connect (Recommended - 0 Setup) */}
              <div className="p-4 rounded-2xl neo-raised space-y-3 border border-emerald-200/60 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Option 1: Direct Personal Google Drive Connect
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Instantly pools your personal Google Drive account into the application without needing to edit Google Cloud Console URI credentials.
                </p>

                {/* 1-Click Chip for current user */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomEmail('omprakashverma.in@gmail.com');
                      setCustomQuotaGb('15');
                      setCustomUsedGb('1.2');
                    }}
                    className="w-full p-2.5 rounded-xl neo-btn flex items-center justify-between text-xs font-mono font-bold text-slate-800 hover:text-blue-700 bg-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      omprakashverma.in@gmail.com
                    </span>
                    <span className="text-[10px] text-blue-600 font-sans font-semibold">
                      Click to Pre-fill ➔
                    </span>
                  </button>
                </div>

                <form onSubmit={handleConnectSubmit} className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Google Account Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. omprakashverma.in@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl neo-inset text-slate-800 text-xs focus:outline-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Drive Quota (GB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={customQuotaGb}
                        onChange={(e) => setCustomQuotaGb(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl neo-inset text-slate-800 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Used Storage (GB)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customUsedGb}
                        onChange={(e) => setCustomUsedGb(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl neo-inset text-slate-800 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(false)}
                      className="px-4 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isConnecting || !customEmail}
                      className="px-5 py-2 rounded-xl neo-btn text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 cursor-pointer disabled:opacity-50"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect to Storage Pool'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Option 2: Browser OAuth Web Flow (Requires Cloud Console redirect URI) */}
              <div className="p-4 rounded-2xl neo-raised space-y-2 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Option 2: Browser OAuth 2.0 Web Redirect
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-semibold">
                    Google Cloud Console
                  </span>
                </div>
                <div className="p-2.5 rounded-xl neo-inset bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">Why &ldquo;Error 400: redirect_uri_mismatch&rdquo; occurs:</p>
                  <p>
                    Google OAuth requires registering the exact callback URI below under:
                    <br />
                    <strong>Google Cloud Console ➔ APIs & Services ➔ Credentials ➔ OAuth 2.0 Client IDs ➔ Authorized redirect URIs</strong>
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-white border border-amber-300 font-mono text-[10px] text-slate-800 select-all flex-1 truncate">
                      http://localhost:3000/api/drive/oauth/callback
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('http://localhost:3000/api/drive/oauth/callback');
                        onNotify?.('Copied redirect URI to clipboard');
                      }}
                      className="px-2 py-1 rounded-lg neo-btn text-[10px] font-bold text-blue-700 hover:text-blue-900 shrink-0 bg-white"
                    >
                      Copy URI
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartOAuth}
                  className="w-full mt-1 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-700 hover:text-blue-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Start OAuth (If Redirect URI Registered)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
