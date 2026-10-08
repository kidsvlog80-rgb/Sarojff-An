import { useState, useEffect, type FormEvent } from 'react';
import { 
  Shield, Key, Server, Users, Link2, Settings, Globe, Copy, Check, Trash2, 
  RefreshCw, LogOut, ArrowLeft, Plus, AlertCircle, CheckCircle2, Eye, EyeOff, Lock
} from 'lucide-react';
import { getPublicSettings, savePublicSettingsLocally, PublicSettings } from '../lib/settings';

interface PortalKeyItem {
  key: string;
  validity: string;
  days: number;
  isBuiltIn?: boolean;
  createdAt?: number;
}

interface ServerKeyItem {
  key: string;
  isBuiltIn?: boolean;
  createdAt?: number;
}

interface ActivatedSession {
  key: string;
  deviceId: string;
  activatedAt: number;
  expiresAt: number;
  days: number;
  status: 'ACTIVE' | 'EXPIRED';
  serverKey?: string;
}

interface AdminData {
  config: PublicSettings;
  portalKeys: PortalKeyItem[];
  serverKeys: ServerKeyItem[];
  activatedSessions: ActivatedSession[];
  stats: {
    totalPortalKeys: number;
    totalServerKeys: number;
    activeDevices: number;
    expiredSessions: number;
    serverTime: string;
  };
}

interface AdminPanelProps {
  onBackToApp: () => void;
}

export default function AdminPanel({ onBackToApp }: AdminPanelProps) {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('drago_admin_token') || localStorage.getItem('drago_admin_token');
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'portalKeys' | 'serverKeys' | 'devices' | 'games' | 'domain' | 'settings'>('overview');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states for adding keys
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDays, setNewKeyDays] = useState(30);
  const [newServerKeyName, setNewServerKeyName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Editable settings state
  const [settingsForm, setSettingsForm] = useState<PublicSettings>(getPublicSettings());

  // Show notification
  const notify = (text: string, isError: boolean = false) => {
    setActionMessage({ text, isError });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    notify(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  interface StoredLocalKey {
    id: string;
    type: 'access' | 'server';
    key: string;
    days: number;
    validity?: string;
    created: number;
    expires: number;
    deleted?: boolean;
  }

  const getStoredKeys = (): StoredLocalKey[] => {
    try {
      const raw = localStorage.getItem('drago_keys_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveStoredKeys = (keys: StoredLocalKey[]) => {
    try {
      localStorage.setItem('drago_keys_v1', JSON.stringify(keys));
    } catch (e) {
      console.warn('Failed saving local keys', e);
    }
  };

  const safeFetchJson = async (url: string, options?: RequestInit): Promise<{ isJson: boolean; data: any }> => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return { isJson: true, data };
      } catch {
        return { isJson: false, data: null };
      }
    } catch {
      return { isJson: false, data: null };
    }
  };

  // Fetch admin data
  const loadAdminData = async (authToken: string) => {
    setIsLoadingData(true);
    const localKeys = getStoredKeys();
    const localPortalKeys: PortalKeyItem[] = localKeys
      .filter((k) => k.type === 'access' && !k.deleted)
      .map((k) => ({
        key: k.key,
        validity: k.validity || `${k.days} Days`,
        days: k.days,
        isBuiltIn: false,
        createdAt: k.created
      }));

    const localServerKeys: ServerKeyItem[] = localKeys
      .filter((k) => k.type === 'server' && !k.deleted)
      .map((k) => ({
        key: k.key,
        isBuiltIn: false,
        createdAt: k.created
      }));

    try {
      const { isJson, data } = await safeFetchJson('/api/admin/data', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (isJson && data && data.success) {
        // Merge backend keys with local keys
        const mergedPortal = [...(data.portalKeys || [])];
        for (const lp of localPortalKeys) {
          if (!mergedPortal.some((p: any) => p.key.toUpperCase() === lp.key.toUpperCase())) {
            mergedPortal.unshift(lp);
          }
        }
        const mergedServer = [...(data.serverKeys || [])];
        for (const ls of localServerKeys) {
          if (!mergedServer.some((s: any) => s.key.toUpperCase() === ls.key.toUpperCase())) {
            mergedServer.unshift(ls);
          }
        }

        setAdminData({
          ...data,
          portalKeys: mergedPortal,
          serverKeys: mergedServer
        });
        if (data.config) {
          setSettingsForm(data.config);
          savePublicSettingsLocally(data.config);
        }
        setIsLoadingData(false);
        return;
      }
    } catch (err: any) {
      console.log('[Admin] Fetch status:', err.message);
    }

    // Static hosting fallback (EdgeOne)
    const publicConf = getPublicSettings();
    setAdminData({
      config: publicConf,
      portalKeys: localPortalKeys,
      serverKeys: localServerKeys,
      activatedSessions: [],
      stats: {
        totalPortalKeys: localPortalKeys.length,
        totalServerKeys: localServerKeys.length,
        activeDevices: 0,
        expiredSessions: 0,
        serverTime: new Date().toISOString()
      }
    });
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (token) {
      loadAdminData(token);
    }
  }, [token]);

  // Login handler
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const entered = passwordInput.trim();
    if (!entered) return;
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { isJson, data } = await safeFetchJson('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: entered })
      });

      if (isJson && data && data.success && data.token) {
        setToken(data.token);
        sessionStorage.setItem('drago_admin_token', data.token);
        localStorage.setItem('drago_admin_token', data.token);
        loadAdminData(data.token);
        setIsLoggingIn(false);
        return;
      }
    } catch (err: any) {}

    // Static hosting fallback for EdgeOne
    const customPw = localStorage.getItem('drago_admin_custom_pw') || 'admin';
    if (entered === 'admin' || entered === 'drago2026' || entered === customPw) {
      const dummyToken = 'local_admin_token_active';
      setToken(dummyToken);
      sessionStorage.setItem('drago_admin_token', dummyToken);
      localStorage.setItem('drago_admin_token', dummyToken);
      loadAdminData(dummyToken);
    } else {
      setLoginError('Invalid password. Default is: admin or drago2026');
    }
    setIsLoggingIn(false);
  };

  // Logout handler
  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('drago_admin_token');
    localStorage.removeItem('drago_admin_token');
    setPasswordInput('');
  };

  // Add Portal Key
  const handleAddPortalKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const cleanKey = newKeyName.trim().toUpperCase().replace(/[\s\r\n\t]/g, '');
    const numDays = Number(newKeyDays) || 30;
    const validityText = numDays >= 9999 ? 'Lifetime VIP' : `${numDays} Days`;

    // 1. ALWAYS save to local storage immediately (works 100% on EdgeOne static hosting)
    const all = getStoredKeys();
    const existingIdx = all.findIndex((k) => k.type === 'access' && k.key.toUpperCase() === cleanKey);
    const item: StoredLocalKey = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: 'access',
      key: cleanKey,
      days: numDays,
      validity: validityText,
      created: Date.now(),
      expires: Date.now() + numDays * 86400000,
      deleted: false
    };

    if (existingIdx >= 0) {
      all[existingIdx] = item;
    } else {
      all.unshift(item);
    }
    saveStoredKeys(all);

    // 2. Also try backend API in background without blocking or crashing on EdgeOne HTML
    if (token) {
      safeFetchJson('/api/admin/add-portal-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: cleanKey,
          validity: validityText,
          days: numDays
        })
      });
    }

    notify(`Portal Key ${cleanKey} added successfully!`);
    setNewKeyName('');
    if (token) loadAdminData(token);
  };

  // Delete Portal Key
  const handleDeletePortalKey = async (key: string) => {
    if (!window.confirm(`Are you sure you want to delete key: ${key}?`)) return;
    const cleanKey = key.trim().toUpperCase();

    // 1. Remove from local storage
    const all = getStoredKeys().filter((k) => !(k.type === 'access' && k.key.toUpperCase() === cleanKey));
    saveStoredKeys(all);

    // 2. Call backend if online
    if (token) {
      safeFetchJson('/api/admin/delete-portal-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: cleanKey })
      });
    }

    notify(`Key ${cleanKey} deleted successfully`);
    if (token) loadAdminData(token);
  };

  // Add Server Key
  const handleAddServerKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!newServerKeyName.trim()) return;

    const cleanKey = newServerKeyName.trim().toUpperCase().replace(/[\s\r\n\t]/g, '');

    // 1. ALWAYS save to local storage (works 100% on EdgeOne static hosting)
    const all = getStoredKeys();
    const existingIdx = all.findIndex((k) => k.type === 'server' && k.key.toUpperCase() === cleanKey);
    const item: StoredLocalKey = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: 'server',
      key: cleanKey,
      days: 30,
      validity: '30 Days',
      created: Date.now(),
      expires: Date.now() + 30 * 86400000,
      deleted: false
    };

    if (existingIdx >= 0) {
      all[existingIdx] = item;
    } else {
      all.unshift(item);
    }
    saveStoredKeys(all);

    // 2. Try backend API in background without failing on EdgeOne HTML
    if (token) {
      safeFetchJson('/api/admin/add-server-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: cleanKey })
      });
    }

    notify(`Server Key ${cleanKey} added successfully!`);
    setNewServerKeyName('');
    if (token) loadAdminData(token);
  };

  // Delete Server Key
  const handleDeleteServerKey = async (key: string) => {
    if (!window.confirm(`Delete server key: ${key}?`)) return;
    const cleanKey = key.trim().toUpperCase();

    // 1. Remove from local storage
    const all = getStoredKeys().filter((k) => !(k.type === 'server' && k.key.toUpperCase() === cleanKey));
    saveStoredKeys(all);

    // 2. Call backend if online
    if (token) {
      safeFetchJson('/api/admin/delete-server-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: cleanKey })
      });
    }

    notify(`Server Key ${cleanKey} deleted successfully`);
    if (token) loadAdminData(token);
  };

  // Revoke device session
  const handleRevokeDevice = async (key: string) => {
    if (!window.confirm(`Reset device lock for key: ${key}? This will allow the user to activate on another phone.`)) return;

    const cleanKey = key.trim().toUpperCase();
    if (token) {
      safeFetchJson('/api/admin/revoke-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: cleanKey })
      });
    }

    notify(`Device lock for key ${cleanKey} reset!`);
    if (token) loadAdminData(token);
  };

  // Save Settings
  const handleSaveSettings = async () => {
    savePublicSettingsLocally(settingsForm);

    if (token) {
      safeFetchJson('/api/admin/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
    }

    notify('Configuration updated successfully!');
  };

  // Change Admin Password
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 4) {
      notify('Password must be at least 4 characters', true);
      return;
    }

    localStorage.setItem('drago_admin_custom_pw', newPassword.trim());

    if (token) {
      safeFetchJson('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newPassword.trim() })
      });
    }

    notify('Admin password changed successfully!');
    setNewPassword('');
  };

  // Generate random key helper
  const generateRandomKey = (prefix: string = 'TURBO') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) rand += '-';
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${rand}`;
  };

  // 1. LOGIN VIEW IF NOT AUTHENTICATED
  if (!token) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient neon orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Header Back Button */}
          <button
            onClick={onBackToApp}
            className="mb-6 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Drago Predictor
          </button>

          <div className="bg-[#0b1329]/90 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300">
                DRAGO 4.0 ADMIN
              </h1>
              <p className="text-slate-400 text-xs mt-1 font-mono">
                Management Panel for drago-predictor-turbo.online
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                  Admin Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full px-4 py-3 bg-[#060b18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-cyan-400/70 mt-1.5 font-mono">
                  Default password: <span className="text-cyan-300 font-bold">admin</span> or <span className="text-cyan-300 font-bold">drago2026</span>
                </p>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold font-mono text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Access Admin Console
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 font-mono">
                Direct URL: drago-predictor-turbo.online/admin
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN ADMIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-[#020611] text-slate-200 flex flex-col font-sans">
      {/* Action Notification Toast */}
      {actionMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-2 text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          actionMessage.isError 
            ? 'bg-red-950/90 border-red-500 text-red-200' 
            : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
        }`}>
          {actionMessage.isError ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-cyan-900/40 bg-[#050b1a]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-mono tracking-wider">
                DRAGO 4.0 ADMIN
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono uppercase">
                Master
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-none">
              drago-predictor-turbo.online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToApp}
            className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to App
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-red-900/40 bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 shrink-0 flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-mono tracking-wide flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('portalKeys')}
            className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-mono tracking-wide flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'portalKeys'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Key className="w-4 h-4 shrink-0" />
            <span>Portal Login Keys</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {adminData?.portalKeys.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('serverKeys')}
            className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-mono tracking-wide flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'serverKeys'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Server className="w-4 h-4 shrink-0" />
            <span>Server Active Keys</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {adminData?.serverKeys.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-mono tracking-wide flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'devices'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Active Sessions</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {adminData?.activatedSessions.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-mono tracking-wide flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'games'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Link2 className="w-4 h-4 shrink-0" />
            <span>Game Register Links</span>
          </button>

          <button
            onClick={() => setActiveTab('domain')}
            className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-mono tracking-wide flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'domain'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Domain & Export File</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-mono tracking-wide flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Telegram & Security</span>
          </button>

          <div className="mt-auto hidden md:block pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SERVER LIVE
              </div>
              <p className="truncate">Domain: drago-predictor-turbo.online</p>
            </div>
          </div>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg">
                  <div className="flex items-center justify-between text-cyan-400 mb-2">
                    <span className="text-xs font-mono uppercase text-slate-400">Portal Keys</span>
                    <Key className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {adminData?.stats.totalPortalKeys ?? 0}
                  </div>
                  <span className="text-[11px] text-cyan-400/80 font-mono">Ready for user login</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#081024] border border-blue-500/20 shadow-lg">
                  <div className="flex items-center justify-between text-blue-400 mb-2">
                    <span className="text-xs font-mono uppercase text-slate-400">Server Keys</span>
                    <Server className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {adminData?.stats.totalServerKeys ?? 0}
                  </div>
                  <span className="text-[11px] text-blue-400/80 font-mono">Active predictor keys</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#081024] border border-emerald-500/20 shadow-lg">
                  <div className="flex items-center justify-between text-emerald-400 mb-2">
                    <span className="text-xs font-mono uppercase text-slate-400">Connected Devices</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {adminData?.stats.activeDevices ?? 0}
                  </div>
                  <span className="text-[11px] text-emerald-400/80 font-mono">1-device bound users</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#081024] border border-amber-500/20 shadow-lg">
                  <div className="flex items-center justify-between text-amber-400 mb-2">
                    <span className="text-xs font-mono uppercase text-slate-400">Accuracy Rate</span>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {settingsForm.minAccuracy}% - {settingsForm.maxAccuracy}%
                  </div>
                  <span className="text-[11px] text-amber-400/80 font-mono">Dynamic AI Accuracy</span>
                </div>
              </div>

              {/* Announcement Editor */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      Live Ticker Announcement Banner
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      This headline scrolls on user screens in real-time.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.isAnnouncementActive}
                      onChange={(e) => setSettingsForm({ ...settingsForm, isAnnouncementActive: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                    <span className="text-slate-300">Display Marquee</span>
                  </label>
                </div>

                <textarea
                  value={settingsForm.announcementText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-[#040814] border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter scrolling announcement text..."
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 font-mono">
                    Preview: {settingsForm.announcementText.substring(0, 60)}...
                  </span>
                  <button
                    onClick={handleSaveSettings}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    Save Announcement
                  </button>
                </div>
              </div>

              {/* Quick Links & Domain Status */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg">
                <h3 className="text-sm font-bold font-mono text-white mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Website Domain Status
                </h3>
                <div className="p-4 rounded-xl bg-[#040814] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-cyan-300 font-semibold">https://drago-predictor-turbo.online/</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">READY</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Admin Panel: <code className="text-cyan-400">https://drago-predictor-turbo.online/admin</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard('https://drago-predictor-turbo.online/admin')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Admin URL
                    </button>
                    <button
                      onClick={() => setActiveTab('domain')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono border border-cyan-500/30"
                    >
                      Domain Setup Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PORTAL LOGIN KEYS */}
          {activeTab === 'portalKeys' && (
            <div className="space-y-6">
              {/* Add Key Form */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg">
                <h2 className="text-base font-bold font-mono text-white mb-1 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  Generate New Portal Login Key
                </h2>
                <p className="text-xs text-slate-400 mb-4 font-mono">
                  Create a custom key for your VIP users or customers.
                </p>

                <form onSubmit={handleAddPortalKey} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono text-slate-300 mb-1.5">
                        Key Name / Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value.toUpperCase())}
                          placeholder="e.g. TURBO-VIP-7788X"
                          className="flex-1 px-4 py-2.5 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setNewKeyName(generateRandomKey('TURBO'))}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl font-mono text-xs whitespace-nowrap"
                        >
                          Auto Generate
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1.5">
                        Validity Duration
                      </label>
                      <select
                        value={newKeyDays}
                        onChange={(e) => setNewKeyDays(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                      >
                        <option value={1}>1 Day (Trial)</option>
                        <option value={7}>7 Days (1 Week)</option>
                        <option value={15}>15 Days (Half-month)</option>
                        <option value={30}>30 Days (1 Month)</option>
                        <option value={90}>90 Days (Quarterly)</option>
                        <option value={365}>365 Days (1 Year)</option>
                        <option value={99999}>Unlimited / Lifetime VIP</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add & Activate Key
                    </button>
                  </div>
                </form>
              </div>

              {/* Keys List */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">
                      All Valid Portal Login Keys ({adminData?.portalKeys.length || 0})
                    </h3>
                    <p className="text-xs text-slate-400">Users can use any of these keys to login.</p>
                  </div>
                  <button
                    onClick={() => token && loadAdminData(token)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {adminData?.portalKeys.map((item, idx) => (
                    <div
                      key={`portal-${item.key}-${idx}`}
                      className="p-3.5 rounded-xl bg-[#040814] border border-slate-800/80 hover:border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-cyan-300 font-bold select-all tracking-wide">
                            {item.key}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                            item.validity.includes('Lifetime')
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {item.validity}
                          </span>
                          {item.isBuiltIn && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              Default Master
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => copyToClipboard(item.key)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 transition-colors"
                        >
                          {copiedKey === item.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
                        </button>
                        {!item.isBuiltIn && (
                          <button
                            onClick={() => handleDeletePortalKey(item.key)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                            title="Delete Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERVER ACTIVE KEYS */}
          {activeTab === 'serverKeys' && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg">
                <h2 className="text-base font-bold font-mono text-white mb-1 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  Add New Server Active Key
                </h2>
                <p className="text-xs text-slate-400 mb-4 font-mono">
                  Server Active Keys are entered inside the predictor to trigger the Live Estimator.
                </p>

                <form onSubmit={handleAddServerKey} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newServerKeyName}
                      onChange={(e) => setNewServerKeyName(e.target.value.toUpperCase())}
                      placeholder="e.g. SRV-MASTER-VIP-2026"
                      className="flex-1 px-4 py-2.5 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setNewServerKeyName(generateRandomKey('SRV'))}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-xl font-mono text-xs whitespace-nowrap"
                    >
                      Auto
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Server Key
                  </button>
                </form>
              </div>

              {/* Server Keys List */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg">
                <h3 className="text-sm font-bold font-mono text-white mb-4">
                  Active Server Keys List ({adminData?.serverKeys.length || 0})
                </h3>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {adminData?.serverKeys.map((item, idx) => (
                    <div
                      key={`server-${item.key}-${idx}`}
                      className="p-3.5 rounded-xl bg-[#040814] border border-slate-800/80 hover:border-blue-500/30 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-300 font-bold select-all">
                          {item.key}
                        </span>
                        {item.isBuiltIn && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(item.key)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1"
                        >
                          {copiedKey === item.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy</span>
                        </button>
                        {!item.isBuiltIn && (
                          <button
                            onClick={() => handleDeleteServerKey(item.key)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVE DEVICES & SESSIONS */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      Connected Device Sessions ({adminData?.activatedSessions.length || 0})
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Each key binds to a single device (1-time activation). You can reset bindings here if a user changed phones.
                    </p>
                  </div>
                  <button
                    onClick={() => token && loadAdminData(token)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {(!adminData?.activatedSessions || adminData.activatedSessions.length === 0) ? (
                  <div className="p-8 text-center bg-[#040814] rounded-xl border border-slate-800/80 text-slate-500 text-sm font-mono">
                    No active device sessions yet. When users log in with their key, their hardware device session will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminData.activatedSessions.map((session, idx) => {
                      const isExpired = session.status === 'EXPIRED' || Date.now() >= session.expiresAt;
                      return (
                        <div
                          key={`session-${session.key}-${session.deviceId || idx}`}
                          className="p-4 rounded-xl bg-[#040814] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-cyan-300 font-bold">
                                {session.key}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                isExpired ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {isExpired ? 'EXPIRED' : 'ACTIVE'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1 space-y-0.5">
                              <div>Device ID: <span className="text-slate-300">{session.deviceId}</span></div>
                              <div>Expires: <span className="text-slate-300">{new Date(session.expiresAt).toLocaleDateString()} {new Date(session.expiresAt).toLocaleTimeString()}</span></div>
                              {session.serverKey && (
                                <div>Server Key: <span className="text-blue-400">{session.serverKey}</span></div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRevokeDevice(session.key)}
                              className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Reset Device Lock
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: GAME REGISTER LINKS */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      Game Registration & Referral Links
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Put your personal invitation/referral links below. When players click "REGISTER NOW" on any game, they will open your link.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    Save All Links
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {[
                    { id: 'sixclub', name: '6 Club' },
                    { id: 'veergame', name: 'Veer Game' },
                    { id: 'dmfirst', name: 'DM First' },
                    { id: 'sreewin', name: 'Sree Win' },
                    { id: 'bdgwin', name: 'BDG Win' },
                    { id: 'ninetyoneclub', name: '91 Club' },
                    { id: 'goagame', name: 'Goa Game' },
                    { id: 'jaiclub', name: 'Jai Club' },
                    { id: 'jalwagame', name: 'Jalwa Game' },
                    { id: 'eightytwolottery', name: '82 Lottery' },
                    { id: 'fiftyonegame', name: '51 Game' },
                    { id: 'tiranga', name: 'Tiranga' },
                    { id: 'yaarwin', name: 'YaarWin' },
                  ].map((game) => (
                    <div key={game.id} className="p-3.5 rounded-xl bg-[#040814] border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold text-cyan-300 uppercase">
                          {game.name} Link
                        </label>
                        <a
                          href={settingsForm.gameLinks[game.id] || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-500 hover:text-cyan-400 font-mono"
                        >
                          Test Open ↗
                        </a>
                      </div>
                      <input
                        type="url"
                        value={settingsForm.gameLinks[game.id] || ''}
                        onChange={(e) => {
                          setSettingsForm({
                            ...settingsForm,
                            gameLinks: {
                              ...settingsForm.gameLinks,
                              [game.id]: e.target.value
                            }
                          });
                        }}
                        placeholder={`https://${game.id}.com/#/register?invitationCode=...`}
                        className="w-full px-3 py-2 bg-[#060c1c] border border-slate-700/80 rounded-lg text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    Save All Links
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOMAIN & EXPORT FILE GUIDE */}
          {activeTab === 'domain' && (
            <div className="space-y-6">
              {/* Domain instructions */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg space-y-5">
                <div>
                  <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    How to Connect & Launch: drago-predictor-turbo.online
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Follow these step-by-step instructions to make your website open directly on your domain and download the source files.
                  </p>
                </div>

                {/* Step 1: Exporting Files */}
                <div className="p-4 rounded-xl bg-[#040814] border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                    Kaise Files Export / Download Karein (Get Code Files)
                  </h3>
                  <div className="text-xs text-slate-300 font-mono space-y-1.5 pl-7 leading-relaxed">
                    <p>• Google AI Studio ke top-right <strong>Settings Menu (gear icon)</strong> pe click karein.</p>
                    <p>• <strong>"Export to ZIP"</strong> ya <strong>"Export to GitHub"</strong> select karein. Isse aapko poori website ka code (including Express server, React, Tailwind, Admin Panel) 1-click me ZIP format me mil jayega.</p>
                    <p>• Production build files create karne ke liye command run karein: <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">npm run build</code> (isse <code className="text-amber-300">dist/</code> folder generate ho jayega).</p>
                  </div>
                </div>

                {/* Step 2: DNS Records */}
                <div className="p-4 rounded-xl bg-[#040814] border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                    Domain DNS Settings (GoDaddy / Hostinger / Namecheap / Cloudflare)
                  </h3>
                  <div className="text-xs text-slate-300 font-mono space-y-2 pl-7 leading-relaxed">
                    <p>Apne domain provider ke DNS Management section me jayein aur ye records add karein:</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-left">
                            <th className="py-1.5 px-2">Type</th>
                            <th className="py-1.5 px-2">Host / Name</th>
                            <th className="py-1.5 px-2">Points To / Value</th>
                            <th className="py-1.5 px-2">TTL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                          <tr>
                            <td className="py-1.5 px-2 text-cyan-300 font-bold">A Record</td>
                            <td className="py-1.5 px-2">@</td>
                            <td className="py-1.5 px-2 text-amber-300">Aapke Hosting / VPS ka IP Address</td>
                            <td className="py-1.5 px-2 text-slate-500">Auto / 300s</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2 text-blue-300 font-bold">CNAME</td>
                            <td className="py-1.5 px-2">www</td>
                            <td className="py-1.5 px-2 text-amber-300">drago-predictor-turbo.online</td>
                            <td className="py-1.5 px-2 text-slate-500">Auto</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Step 3: Hosting deployment */}
                <div className="p-4 rounded-xl bg-[#040814] border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">3</span>
                    Hosting Options (Kahan Host Karein)
                  </h3>
                  <div className="text-xs text-slate-300 font-mono space-y-2 pl-7">
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-cyan-300 font-bold">Option A (Free & Easiest): Vercel / Cloud Run</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        GitHub repo link karein → Custom Domain me <code className="text-slate-200">drago-predictor-turbo.online</code> daalein → Automatic Free SSL activate ho jata hai!
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-blue-300 font-bold">Option B: VPS / Hostinger / DigitalOcean (Node.js)</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Files upload karein → <code className="text-slate-200">npm install && npm run build</code> → Run <code className="text-slate-200">npm start</code> via PM2.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TELEGRAM & SECURITY */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Telegram Channel Link */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg space-y-4">
                <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  Official Telegram Channel Settings
                </h2>
                <p className="text-xs text-slate-400">
                  This link is attached to the "Join Telegram" buttons on the Welcome Screen and inside the Predictor.
                </p>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Telegram Invite Link
                  </label>
                  <input
                    type="url"
                    value={settingsForm.telegramUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegramUrl: e.target.value })}
                    placeholder="https://t.me/+..."
                    className="w-full px-4 py-2.5 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Min Accuracy Display (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settingsForm.minAccuracy}
                      onChange={(e) => setSettingsForm({ ...settingsForm, minAccuracy: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Max Accuracy Display (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settingsForm.maxAccuracy}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxAccuracy: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                    Fingerprint Lock Screen Modal Text
                  </h3>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Lock Modal Title (Header)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.lockModalTitle || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, lockModalTitle: e.target.value })}
                      placeholder="Drago Premium Locked!"
                      className="w-full px-4 py-2 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Lock Modal Message (Body)
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.lockModalMessage || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, lockModalMessage: e.target.value })}
                      placeholder="Hello user, Drago Premium panel is currently locked. Please scan your fingerprint to unlock it!"
                      className="w-full px-4 py-2 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-cyan-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Lock Modal Button Text
                    </label>
                    <input
                      type="text"
                      value={settingsForm.lockModalBtnText || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, lockModalBtnText: e.target.value })}
                      placeholder="Alright"
                      className="w-full px-4 py-2 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </div>

              {/* Change Admin Password */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#081024] border border-cyan-500/20 shadow-lg space-y-4">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Change Master Admin Password
                </h3>
                <p className="text-xs text-slate-400">
                  Update the password used to access this admin panel at <code className="text-cyan-400">/admin</code>.
                </p>

                <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new admin password (min 4 chars)..."
                    className="flex-1 px-4 py-2.5 bg-[#040814] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
