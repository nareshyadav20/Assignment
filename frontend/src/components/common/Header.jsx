import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { ThemeToggle } from './ThemeToggle';
import {
  Building2,
  Users,
  ChevronDown,
  LogOut,
  Shield,
  UserCheck,
  Sparkles
} from 'lucide-react';

export const Header = () => {
  const { user, tenant, logout, quickSwitchPersona } = useAuth();
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
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
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      {/* Current Tenant Banner */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">{tenant?.name || 'Enterprise'}</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono">
            {tenant?.slug}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Tenant Isolated</span>
        </div>
      </div>

      {/* Right Actions: Theme Toggle, Persona Switcher & User Profile */}
      <div className="flex items-center gap-3">
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
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsPersonaOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select User Persona
                </div>

                {personas.map((group) => (
                  <div key={group.tenantSlug} className="mt-2 pt-2 border-t border-slate-800/80 first:border-0 first:pt-0">
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
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
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
