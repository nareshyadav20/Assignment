import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Building } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const fillCredentialsAndLogin = async (userEmail, userPass = 'Admin@123') => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
    setLoading(true);

    const result = await login(userEmail, userPass);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Theme Toggle Button at top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle showLabel={true} />
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Deep Trace Cybernetics</h1>
          <p className="text-sm text-slate-400 mt-1">Multi-Tenant Security Operations Platform</p>
        </div>

        {/* Login Form Box */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@abc.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluator Login Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Evaluator Personas (Pre-Seeded)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Tenant A Personas */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-indigo-400 text-[11px] flex items-center gap-1">
                  <Building className="w-3 h-3" /> Tenant A: ABC Tech
                </div>
                <button
                  type="button"
                  onClick={() => fillCredentialsAndLogin('admin@abc.com')}
                  className="w-full text-left px-2 py-1 rounded bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>Alice (Admin)</span>
                  <span className="text-[10px] text-rose-400 font-mono">ADMIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentialsAndLogin('manager@abc.com')}
                  className="w-full text-left px-2 py-1 rounded bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>Bob (Manager)</span>
                  <span className="text-[10px] text-amber-400 font-mono">MGR</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentialsAndLogin('user@abc.com')}
                  className="w-full text-left px-2 py-1 rounded bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>Charlie (User)</span>
                  <span className="text-[10px] text-indigo-400 font-mono">USER</span>
                </button>
              </div>

              {/* Tenant B Personas */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-cyan-400 text-[11px] flex items-center gap-1">
                  <Building className="w-3 h-3" /> Tenant B: XYZ Sol
                </div>
                <button
                  type="button"
                  onClick={() => fillCredentialsAndLogin('admin@xyz.com')}
                  className="w-full text-left px-2 py-1 rounded bg-slate-800/80 hover:bg-cyan-600/20 text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>Xavier (Admin)</span>
                  <span className="text-[10px] text-rose-400 font-mono">ADMIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentialsAndLogin('manager@xyz.com')}
                  className="w-full text-left px-2 py-1 rounded bg-slate-800/80 hover:bg-cyan-600/20 text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>Yvonne (Manager)</span>
                  <span className="text-[10px] text-amber-400 font-mono">MGR</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentialsAndLogin('user@xyz.com')}
                  className="w-full text-left px-2 py-1 rounded bg-slate-800/80 hover:bg-cyan-600/20 text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>Zack (User)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">USER</span>
                </button>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-center text-slate-500">
              Default password for all seed accounts is <code className="text-slate-400">Admin@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
