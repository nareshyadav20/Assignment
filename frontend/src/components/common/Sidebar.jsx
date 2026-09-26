import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShieldAlert,
  Target,
  Users,
  ScrollText,
  ShieldCheck,
  Server
} from 'lucide-react';

export const Sidebar = () => {
  const { can } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: can('DASHBOARD_VIEW')
    },
    {
      to: '/campaigns',
      label: 'Campaigns',
      icon: Target,
      visible: can('CAMPAIGN_READ')
    },
    {
      to: '/events',
      label: 'Security Events',
      icon: ShieldAlert,
      visible: can('EVENT_READ')
    },
    {
      to: '/users',
      label: 'Team & Access',
      icon: Users,
      visible: can('USER_VIEW')
    },
    {
      to: '/audit-logs',
      label: 'Audit Trail',
      icon: ScrollText,
      visible: can('AUDIT_LOGS_VIEW')
    }
  ];

  return (
    <aside className="w-64 flex flex-col bg-slate-900 border-r border-slate-800 shrink-0 select-none">
      {/* Platform Branding */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            DEEP TRACE
          </h1>
          <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">
            Cybernetics Guard
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Platform Health & Version Badge */}
      <div className="p-4 border-t border-slate-800">
        <div className="glass-panel rounded-xl p-3 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              API Gateway
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">HEALTHY</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
            <span>Isolation</span>
            <span className="text-slate-300">RLS + App Logic</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
