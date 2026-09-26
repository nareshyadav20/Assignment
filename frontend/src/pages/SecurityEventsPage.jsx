import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  ShieldAlert,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Filter,
  Activity,
  Layers
} from 'lucide-react';

export const SecurityEventsPage = () => {
  const { tenant, can } = useAuth();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [formData, setFormData] = useState({
    eventType: '',
    severity: 'MEDIUM',
    status: 'OPEN',
    description: '',
    source: ''
  });

  const [updateData, setUpdateData] = useState({
    status: 'OPEN',
    severity: 'MEDIUM',
    description: ''
  });

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/events/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (e) {
      console.warn('Could not fetch event stats:', e);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(severityFilter && { severity: severityFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await apiClient.get(`/events?${params.toString()}`);
      if (response.data.success) {
        setEvents(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch security events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [pagination.page, severityFilter, statusFilter, tenant?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchEvents();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/events', formData);
      setIsCreateOpen(false);
      setFormData({
        eventType: '',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: '',
        source: ''
      });
      setSuccessMsg('Security incident successfully registered.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchEvents();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register security event.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.patch(`/events/${selectedEvent.id}`, updateData);
      setIsUpdateOpen(false);
      setSelectedEvent(null);
      setSuccessMsg('Security incident status updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchEvents();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event status.');
    }
  };

  const handleDelete = async (id, eventType) => {
    if (!window.confirm(`Are you sure you want to permanently delete event '${eventType}'?`)) return;
    setError('');
    try {
      await apiClient.delete(`/events/${id}`);
      setSuccessMsg('Security event deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchEvents();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Incident Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time SIEM/EDR detection alerts for <span className="text-indigo-400 font-semibold">{tenant?.name}</span>
          </p>
        </div>

        {can('EVENT_CREATE') && (
          <button
            onClick={() => {
              setFormData({
                eventType: '',
                severity: 'MEDIUM',
                status: 'OPEN',
                description: '',
                source: ''
              });
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Severity Metric Pills */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? '' : 'CRITICAL')}
            className={`p-3 rounded-xl glass-panel border cursor-pointer transition-all ${
              severityFilter === 'CRITICAL' ? 'border-red-500 bg-red-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-red-400">CRITICAL</span>
              <span className="text-lg font-bold text-white">{stats.bySeverity.CRITICAL}</span>
            </div>
          </div>

          <div
            onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? '' : 'HIGH')}
            className={`p-3 rounded-xl glass-panel border cursor-pointer transition-all ${
              severityFilter === 'HIGH' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-orange-400">HIGH</span>
              <span className="text-lg font-bold text-white">{stats.bySeverity.HIGH}</span>
            </div>
          </div>

          <div
            onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? '' : 'MEDIUM')}
            className={`p-3 rounded-xl glass-panel border cursor-pointer transition-all ${
              severityFilter === 'MEDIUM' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-amber-400">MEDIUM</span>
              <span className="text-lg font-bold text-white">{stats.bySeverity.MEDIUM}</span>
            </div>
          </div>

          <div
            onClick={() => setSeverityFilter(severityFilter === 'LOW' ? '' : 'LOW')}
            className={`p-3 rounded-xl glass-panel border cursor-pointer transition-all ${
              severityFilter === 'LOW' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-blue-400">LOW</span>
              <span className="text-lg font-bold text-white">{stats.bySeverity.LOW}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search events by type, description, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </form>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading security events...</div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No security incidents match the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Event Signature</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Telemetry Source</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5 max-w-md">
                      <div className="font-mono font-semibold text-white text-xs">{evt.eventType}</div>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{evt.description}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge variant={evt.severity}>{evt.severity}</Badge>
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge variant={evt.status}>{evt.status}</Badge>
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">{evt.source}</td>

                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(evt.createdAt).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {can('EVENT_UPDATE_STATUS') && (
                          <button
                            onClick={() => {
                              setSelectedEvent(evt);
                              setUpdateData({
                                status: evt.status,
                                severity: evt.severity,
                                description: evt.description
                              });
                              setIsUpdateOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Triage & Update Status"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {can('EVENT_DELETE') && (
                          <button
                            onClick={() => handleDelete(evt.id, evt.eventType)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Event (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing Page <span className="text-white font-semibold">{pagination.page}</span> of{' '}
            <span className="text-white font-semibold">{pagination.totalPages}</span> ({pagination.total} Total)
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Report Security Incident">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Event Type / Signature *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SUSPICIOUS_CREDENTIAL_STUFFING"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Severity *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Telemetry Source *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CrowdStrike Falcon, AWS GuardDuty, WAF"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Incident Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide IOCs, compromised hosts, or anomaly indicators..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              Register Incident
            </button>
          </div>
        </form>
      </Modal>

      {/* Triage / Update Modal */}
      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title={`Triage Incident - ${selectedEvent?.eventType}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Severity</label>
              <select
                value={updateData.severity}
                onChange={(e) => setUpdateData({ ...updateData, severity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Description / Remediation Notes
            </label>
            <textarea
              rows={3}
              value={updateData.description}
              onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsUpdateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              Save Triage
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
