import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  Target,
  ShieldAlert,
  AlertTriangle,
  Users,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  FileText
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const DashboardPage = () => {
  const { user, tenant, can } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/dashboard/overview');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [tenant?.id]);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading tenant analytics...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    campaigns: { total: 0, active: 0, completed: 0 },
    events: { total: 0, open: 0, critical: 0, high: 0 },
    users: { total: 0, active: 0 }
  };

  const severityChartData = data?.charts?.eventsBySeverity || [];
  const campaignChartData = data?.charts?.campaignsByStatus || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security telemetry for <span className="text-indigo-400 font-semibold">{tenant?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value={summary.campaigns.active}
          subtitle={`Total: ${summary.campaigns.total} | ${summary.campaigns.completed} Completed`}
          icon={Target}
          color="indigo"
        />

        <StatCard
          title="Open Incidents"
          value={summary.events.open}
          subtitle={`Total Logged: ${summary.events.total}`}
          icon={ShieldAlert}
          color="red"
        />

        <StatCard
          title="Critical / High Alerts"
          value={summary.events.critical + summary.events.high}
          subtitle={`${summary.events.critical} Critical, ${summary.events.high} High`}
          icon={AlertTriangle}
          color="amber"
        />

        <StatCard
          title="Tenant Team Members"
          value={summary.users.active}
          subtitle={`Total Enrolled: ${summary.users.total}`}
          icon={Users}
          color="cyan"
        />
      </div>

      {/* Visual Analytics Charts */}
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
              Latest Security Events
            </h2>
            <Link
              to="/events"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
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
                    <p className="text-[10px] text-slate-500 font-mono">
                      Source: {evt.source} | {new Date(evt.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No recent security events.</p>
            )}
          </div>
        </div>

        {/* Live Tenant Audit Trail */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Tenant Audit Stream
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
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{log.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>User: {log.user?.name || 'System'}</span>
                    <span>•</span>
                    <span>IP: {log.ipAddress || 'Internal'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No recent audit log entries.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
