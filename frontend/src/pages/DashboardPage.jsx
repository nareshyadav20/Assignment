import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  Target,
  ShieldAlert,
  AlertTriangle,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  FileText,
  Calendar,
  Radio
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const DashboardPage = () => {
  const { user, tenant, can } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchOverview = useCallback(async (selectedRange = range, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/dashboard/overview?range=${selectedRange}`);
      if (response.data.success) {
        setData(response.data.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard overview.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchOverview(range);
  }, [range, tenant?.id, fetchOverview]);

  // Real-Time automatic refresh when security events or campaigns change
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      console.log('⚡ Real-time event detected, updating dashboard metrics...');
      fetchOverview(range, true);
    };

    socket.on('SECURITY_EVENT_CREATED', handleRealtimeUpdate);
    socket.on('SECURITY_EVENT_UPDATED', handleRealtimeUpdate);
    socket.on('SECURITY_EVENT_DELETED', handleRealtimeUpdate);
    socket.on('CAMPAIGN_CREATED', handleRealtimeUpdate);
    socket.on('CAMPAIGN_UPDATED', handleRealtimeUpdate);
    socket.on('CAMPAIGN_DELETED', handleRealtimeUpdate);

    return () => {
      socket.off('SECURITY_EVENT_CREATED', handleRealtimeUpdate);
      socket.off('SECURITY_EVENT_UPDATED', handleRealtimeUpdate);
      socket.off('SECURITY_EVENT_DELETED', handleRealtimeUpdate);
      socket.off('CAMPAIGN_CREATED', handleRealtimeUpdate);
      socket.off('CAMPAIGN_UPDATED', handleRealtimeUpdate);
      socket.off('CAMPAIGN_DELETED', handleRealtimeUpdate);
    };
  }, [socket, range, fetchOverview]);

  const SEVERITY_COLORS = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#3b82f6',
  };

  const STATUS_COLORS = {
    ACTIVE: '#10b981',
    DRAFT: '#64748b',
    COMPLETED: '#06b6d4',
    CANCELLED: '#f43f5e',
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-800/40 rounded-xl animate-pulse w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-800/40 rounded-2xl animate-pulse" />
          <div className="h-72 bg-slate-800/40 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    campaigns: { total: 0, active: 0, completed: 0 },
    events: { total: 0, open: 0, critical: 0, high: 0, resolved: 0 },
    users: { total: 0, active: 0 }
  };

  const severityChartData = data?.charts?.eventsBySeverity || [];
  const campaignChartData = data?.charts?.campaignsByStatus || [];
  const eventTrendsData = data?.charts?.eventTrends || [];

  return (
    <div className="space-y-6">
      {/* Top Banner with Date Filters & Live Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Security Command Center</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Auto-Synced
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational threat telemetry for <span className="text-indigo-400 font-semibold">{tenant?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setRange('today')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                range === 'today' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                range === '7d' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                range === '30d' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <button
            onClick={() => fetchOverview(range)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
            title="Manual sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {can('CAMPAIGN_CREATE') && (
            <Link
              to="/campaigns"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/25"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Campaign</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* 5 Real-Time KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Users"
          value={summary.users.total}
          subtitle={`${summary.users.active} Active accounts`}
          icon={Users}
          color="cyan"
        />

        <StatCard
          title="Active Campaigns"
          value={summary.campaigns.active}
          subtitle={`${summary.campaigns.completed} Completed drills`}
          icon={Target}
          color="indigo"
        />

        <StatCard
          title="Open Events"
          value={summary.events.open}
          subtitle={`Total Logged: ${summary.events.total}`}
          icon={ShieldAlert}
          color="amber"
        />

        <StatCard
          title="Critical Events"
          value={summary.events.critical}
          subtitle={`${summary.events.high} High priority`}
          icon={AlertTriangle}
          color="red"
        />

        <StatCard
          title="Resolved Events"
          value={summary.events.resolved}
          subtitle="Triaged & neutralized"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Security Event Trends Chart */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Security Event Telemetry Trends
            </h2>
            <p className="text-xs text-slate-400">Incident velocity and severity distribution over time</p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Range: {range.toUpperCase()}</span>
        </div>

        <div className="h-64 w-full">
          {eventTrendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={eventTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Legend verticalAlign="top" height={30} formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
                <Area type="monotone" dataKey="total" name="Total Events" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="CRITICAL" name="Critical Severity" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCritical)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No trend data recorded for this time window.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Severity Breakdown */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Security Events by Severity</h2>
              <p className="text-xs text-slate-400">Threat posture categorization</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityChartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={SEVERITY_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No security event data registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Campaign Lifecycle Distribution */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Campaign Status Distribution</h2>
              <p className="text-xs text-slate-400">Current progress of security initiatives</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {campaignChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {campaignChartData.map((entry) => (
                      <Cell
                        key={`bar-${entry.name}`}
                        fill={STATUS_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No campaign data registered yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Events & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Incidents */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Latest Security Alerts
            </h2>
            <Link
              to="/events"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              All Alerts <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.recentEvents && data.recentEvents.length > 0 ? (
              data.recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 transition-colors hover:border-slate-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white font-mono">{evt.eventType}</span>
                      <Badge variant={evt.severity} size="xs">
                        {evt.severity}
                      </Badge>
                      <Badge variant={evt.status} size="xs">
                        {evt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{evt.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>Source: {evt.source}</span>
                      {evt.assignedTo && <span>• Assigned: {evt.assignedTo.name}</span>}
                      <span>• {new Date(evt.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No recent security events.</p>
            )}
          </div>
        </div>

        {/* Live Tenant Audit Trail */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Tenant Activity Trail
            </h2>
            {can('AUDIT_LOGS_VIEW') && (
              <Link
                to="/audit-logs"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
              >
                Full Trail <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="space-y-2.5">
            {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
              data.recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 font-mono">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{log.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>Actor: {log.user?.name || 'System'}</span>
                    <span>•</span>
                    <span>IP: {log.ipAddress || 'Internal'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No recent audit log entries.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
