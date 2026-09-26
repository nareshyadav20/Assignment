import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Badge } from './Badge';
import { ThemeToggle } from './ThemeToggle';
import {
  Building2,
  ChevronDown,
  LogOut,
  Sparkles,
  Bell,
  Check,
  Trash2,
  Radio,
  ShieldAlert
} from 'lucide-react';

export const Header = () => {
  const { user, tenant, logout, quickSwitchPersona } = useAuth();
  const { isConnected, notifications, unreadCount, markAllRead, clearNotifications } = useSocket();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const personas = [
    {
      tenantName: 'ABC Technologies',
      tenantSlug: 'abc-tech',
      users: [
        { name: 'Alice Admin', email: 'admin@abc.com', role: 'ADMIN' },
        { name: 'Bob Manager', email: 'manager@abc.com', role: 'MANAGER' },
        { name: 'Charlie Analyst', email: 'user@abc.com', role: 'USER' },
      ]
    },
    {
      tenantName: 'XYZ Solutions',
      tenantSlug: 'xyz-solutions',
      users: [
        { name: 'Xavier Admin', email: 'admin@xyz.com', role: 'ADMIN' },
        { name: 'Yvonne Manager', email: 'manager@xyz.com', role: 'MANAGER' },
        { name: 'Zack Specialist', email: 'user@xyz.com', role: 'USER' },
      ]
    }
  ];

  const handleSwitch = async (email) => {
    setSwitching(true);
    await quickSwitchPersona(email);
    setSwitching(false);
    setIsPersonaOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 transition-colors">
      {/* Current Tenant Banner & Real-Time Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">{tenant?.name || 'Enterprise'}</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono">
            {tenant?.slug}
          </span>
        </div>

        {/* Live Real-Time Connection Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <Radio className="w-3 h-3" />
            {isConnected ? 'LIVE TELEMETRY' : 'RECONNECTING'}
          </span>
        </div>
      </div>

      {/* Right Actions: Notifications, Theme Toggle, Persona Switcher & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Real-Time Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen && unreadCount > 0) {
                markAllRead();
              }
            }}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Real-Time Security Notifications"
            aria-label="Security notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Security Notifications
                    </h3>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No incoming security alerts. System is normal.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                          n.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : n.severity === 'HIGH'
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="font-mono text-xs">{n.title}</span>
                          {n.severity && (
                            <Badge variant={n.severity} size="xs">
                              {n.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] opacity-90 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] opacity-60 font-mono block">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* White / Dark Theme Toggle */}
        <ThemeToggle />

        {/* Quick Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
            title="Quickly switch between Tenant A & B personas to test RBAC & Isolation"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Switch Persona (Evaluator Mode)</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPersonaOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPersonaOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select User Persona
                </div>

                {personas.map((group) => (
                  <div
                    key={group.tenantSlug}
                    className="mt-2 pt-2 border-t border-slate-800/80 first:border-0 first:pt-0"
                  >
                    <div className="px-2 py-1 flex items-center justify-between text-xs font-bold text-indigo-400">
                      <span>{group.tenantName}</span>
                      <span className="text-[10px] font-mono opacity-70">({group.tenantSlug})</span>
                    </div>

                    <div className="space-y-1 mt-1">
                      {group.users.map((p) => {
                        const isCurrent = user?.email === p.email;
                        return (
                          <button
                            key={p.email}
                            disabled={switching}
                            onClick={() => handleSwitch(p.email)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              isCurrent
                                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-medium">{p.name}</p>
                              <p className="text-[11px] text-slate-400">{p.email}</p>
                            </div>
                            <Badge variant={p.role} size="xs">
                              {p.role}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Current User Info */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[11px] text-slate-400">{user?.email}</p>
          </div>

          <Badge variant={user?.role}>{user?.role}</Badge>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
