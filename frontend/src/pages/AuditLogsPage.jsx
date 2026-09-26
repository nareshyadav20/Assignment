import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  ScrollText,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Globe,
  Database
} from 'lucide-react';

export const AuditLogsPage = () => {
  const { tenant } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [error, setError] = useState('');

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(actionFilter && { action: actionFilter }),
        ...(resourceFilter && { resourceType: resourceFilter })
      });

      const response = await apiClient.get(`/audit-logs?${params.toString()}`);
      if (response.data.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter, resourceFilter, tenant?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Immutable Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident activity logs for compliance and forensics in{' '}
            <span className="text-indigo-400 font-semibold">{tenant?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tenant Scoped & Append-Only</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Actions</option>
          <option value="USER_LOGIN_SUCCESS">USER_LOGIN_SUCCESS</option>
          <option value="USER_LOGIN_FAILED">USER_LOGIN_FAILED</option>
          <option value="USER_LOGOUT">USER_LOGOUT</option>
          <option value="CAMPAIGN_CREATE">CAMPAIGN_CREATE</option>
          <option value="CAMPAIGN_UPDATE">CAMPAIGN_UPDATE</option>
          <option value="CAMPAIGN_DELETE">CAMPAIGN_DELETE</option>
          <option value="CAMPAIGN_MEMBER_ASSIGN">CAMPAIGN_MEMBER_ASSIGN</option>
          <option value="SECURITY_EVENT_CREATE">SECURITY_EVENT_CREATE</option>
          <option value="SECURITY_EVENT_UPDATE">SECURITY_EVENT_UPDATE</option>
          <option value="SECURITY_EVENT_DELETE">SECURITY_EVENT_DELETE</option>
          <option value="USER_CREATE">USER_CREATE</option>
          <option value="USER_UPDATE">USER_UPDATE</option>
          <option value="USER_DELETE">USER_DELETE</option>
        </select>

        <select
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Resource Types</option>
          <option value="AUTH">AUTH</option>
          <option value="CAMPAIGN">CAMPAIGN</option>
          <option value="SECURITY_EVENT">SECURITY_EVENT</option>
          <option value="USER">USER</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No audit log records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action Signature</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Initiated By</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-5 py-3 font-semibold text-indigo-400 text-[11px]">
                      {log.action}
                    </td>

                    <td className="px-5 py-3 text-slate-300 font-sans text-xs max-w-md">
                      <span className="line-clamp-1">{log.description}</span>
                    </td>

                    <td className="px-5 py-3 font-sans text-xs">
                      {log.user ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white">{log.user.name}</span>
                          <span className="text-[10px] text-slate-500">({log.user.role})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">System / Unauth</span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="View Structured Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 font-sans">
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

      {/* Structured Payload Viewer Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event Inspection - ${selectedLog?.action}`}
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Resource Type</span>
                <span className="text-white font-semibold">{selectedLog.resourceType}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Resource ID</span>
                <span className="text-slate-300 font-mono text-[11px] truncate block">
                  {selectedLog.resourceId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Actor</span>
                <span className="text-white font-semibold">
                  {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">IP Address</span>
                <span className="text-slate-300 font-mono text-[11px]">{selectedLog.ipAddress || 'Internal'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                Event Description
              </span>
              <p className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200">
                {selectedLog.description}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                Structured Metadata JSON
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-xs overflow-x-auto">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
