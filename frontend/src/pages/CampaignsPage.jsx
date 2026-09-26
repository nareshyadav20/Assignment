import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Target,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  X,
  Play,
  CheckCircle,
  Eye,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export const CampaignsPage = () => {
  const { tenant, can } = useAuth();
  const { socket } = useSocket();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    startDate: '',
    endDate: ''
  });

  const [tenantUsers, setTenantUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchCampaigns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await apiClient.get(`/campaigns?${params.toString()}`);
      if (response.data.success) {
        setCampaigns(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch campaigns.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  const fetchTenantUsers = async () => {
    try {
      const response = await apiClient.get('/users?limit=100');
      if (response.data.success) {
        setTenantUsers(response.data.data);
      }
    } catch (e) {
      console.warn('Could not fetch tenant users:', e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchTenantUsers();
  }, [pagination.page, statusFilter, tenant?.id, fetchCampaigns]);

  // Real-Time automatic refresh
  useEffect(() => {
    if (!socket) return;

    const handleCampaignSync = () => {
      fetchCampaigns(true);
    };

    socket.on('CAMPAIGN_CREATED', handleCampaignSync);
    socket.on('CAMPAIGN_UPDATED', handleCampaignSync);
    socket.on('CAMPAIGN_DELETED', handleCampaignSync);
    socket.on('CAMPAIGN_MEMBER_ASSIGNED', handleCampaignSync);
    socket.on('CAMPAIGN_MEMBER_REMOVED', handleCampaignSync);

    return () => {
      socket.off('CAMPAIGN_CREATED', handleCampaignSync);
      socket.off('CAMPAIGN_UPDATED', handleCampaignSync);
      socket.off('CAMPAIGN_DELETED', handleCampaignSync);
      socket.off('CAMPAIGN_MEMBER_ASSIGNED', handleCampaignSync);
      socket.off('CAMPAIGN_MEMBER_REMOVED', handleCampaignSync);
    };
  }, [socket, fetchCampaigns]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCampaigns();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/campaigns', formData);
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', status: 'DRAFT', startDate: '', endDate: '' });
      setSuccessMsg('Campaign created successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign.');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.put(`/campaigns/${selectedCampaign.id}`, formData);
      setIsEditOpen(false);
      setSelectedCampaign(null);
      setSuccessMsg('Campaign updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update campaign.');
    }
  };

  const handleQuickStatusTransition = async (campaign, newStatus) => {
    try {
      await apiClient.put(`/campaigns/${campaign.id}`, { status: newStatus });
      setSuccessMsg(`Campaign status changed to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (selectedCampaign?.id === campaign.id) {
        setSelectedCampaign((prev) => ({ ...prev, status: newStatus }));
      }
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change campaign status.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete campaign '${name}'?`)) return;
    setError('');
    try {
      await apiClient.delete(`/campaigns/${id}`);
      setSuccessMsg('Campaign deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete campaign.');
    }
  };

  const openAssignModal = async (campaign) => {
    setSelectedCampaign(campaign);
    await fetchTenantUsers();
    setIsAssignOpen(true);
  };

  const handleAssignUser = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await apiClient.post(`/campaigns/${selectedCampaign.id}/assign`, {
        userId: selectedUserId
      });
      setSelectedUserId('');
      const updated = await apiClient.get(`/campaigns/${selectedCampaign.id}`);
      setSelectedCampaign(updated.data.data);
      fetchCampaigns(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign user.');
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await apiClient.delete(`/campaigns/${selectedCampaign.id}/assign/${userId}`);
      const updated = await apiClient.get(`/campaigns/${selectedCampaign.id}`);
      setSelectedCampaign(updated.data.data);
      fetchCampaigns(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Campaigns & Drills</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spear-phishing simulations, SOC 2 certifications, and vulnerability reviews for{' '}
            <span className="text-indigo-400 font-semibold">{tenant?.name}</span>
          </p>
        </div>

        {can('CAMPAIGN_CREATE') && (
          <button
            onClick={() => {
              setFormData({ name: '', description: '', status: 'DRAFT', startDate: '', endDate: '' });
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
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
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search campaigns by name, objective, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Campaigns Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading security initiatives...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No campaigns found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Campaign & Objectives</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Timeline Dates</th>
                  <th className="px-5 py-3">Assigned Operators</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="font-semibold text-white text-sm">{camp.name}</div>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                        {camp.description || 'No description provided.'}
                      </p>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Lead: <span className="text-slate-300">{camp.createdBy?.name || 'System'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge variant={camp.status}>{camp.status}</Badge>
                    </td>

                    <td className="px-5 py-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-indigo-400 font-bold">{camp.progress || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              camp.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : camp.status === 'ACTIVE'
                                ? 'bg-indigo-500'
                                : 'bg-slate-600'
                            }`}
                            style={{ width: `${camp.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'TBD'} -{' '}
                          {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openAssignModal(camp)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{camp._count?.assignments || camp.assignments?.length || 0} Members</span>
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedCampaign(camp);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View Campaign Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {can('CAMPAIGN_UPDATE') && (
                          <button
                            onClick={() => {
                              setSelectedCampaign(camp);
                              setFormData({
                                name: camp.name,
                                description: camp.description || '',
                                status: camp.status,
                                startDate: camp.startDate ? camp.startDate.split('T')[0] : '',
                                endDate: camp.endDate ? camp.endDate.split('T')[0] : ''
                              });
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {can('CAMPAIGN_DELETE') && (
                          <button
                            onClick={() => handleDelete(camp.id, camp.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Campaign (Admin Only)"
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

        {/* Server Pagination */}
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

      {/* Campaign Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Security Campaign Dossier"
        maxWidth="max-w-2xl"
      >
        {selectedCampaign && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                <p className="text-slate-400 mt-1">{selectedCampaign.description || 'No details provided.'}</p>
              </div>
              <Badge variant={selectedCampaign.status} size="md">
                {selectedCampaign.status}
              </Badge>
            </div>

            {/* Quick Status Transitions */}
            {can('CAMPAIGN_UPDATE') && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Quick Status Transitions:</span>
                <div className="flex gap-2">
                  {selectedCampaign.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleQuickStatusTransition(selectedCampaign, 'ACTIVE')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start Drill</span>
                    </button>
                  )}
                  {selectedCampaign.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleQuickStatusTransition(selectedCampaign, 'COMPLETED')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Campaign ID</span>
                <span className="text-indigo-400 font-mono text-[11px] break-all">{selectedCampaign.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Created By</span>
                <span className="text-white font-medium">{selectedCampaign.createdBy?.name} ({selectedCampaign.createdBy?.role})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Start Date</span>
                <span className="text-slate-300">
                  {selectedCampaign.startDate ? new Date(selectedCampaign.startDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">End Date</span>
                <span className="text-slate-300">
                  {selectedCampaign.endDate ? new Date(selectedCampaign.endDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                Assigned Security Team ({selectedCampaign.assignments?.length || 0})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedCampaign.assignments?.length === 0 ? (
                  <p className="text-slate-500 italic py-2">No team members assigned yet.</p>
                ) : (
                  selectedCampaign.assignments?.map((a) => (
                    <div key={a.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-white">{a.user?.name}</span>
                        <span className="text-slate-500 text-[11px] ml-2 font-mono">{a.user?.email}</span>
                      </div>
                      <Badge variant={a.user?.role} size="xs">
                        {a.user?.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Campaign Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Security Campaign">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Executive Spear-Phishing Drill"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Description / Scope
            </label>
            <textarea
              rows={3}
              placeholder="Scope, objectives, attack vectors, or compliance requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
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
              Create Campaign
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Security Campaign">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Users Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={`Assigned Members: ${selectedCampaign?.name}`}
      >
        <div className="space-y-4">
          {can('CAMPAIGN_ASSIGN_USER') && (
            <form onSubmit={handleAssignUser} className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select team member to assign...</option>
                {tenantUsers
                  .filter((u) => !selectedCampaign?.assignments?.some((a) => a.userId === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.email}
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                disabled={!selectedUserId}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign</span>
              </button>
            </form>
          )}

          <div className="space-y-2 mt-3">
            <div className="text-xs font-semibold text-slate-400 uppercase">Current Assignments:</div>
            {selectedCampaign?.assignments?.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No members currently assigned to this campaign.</p>
            ) : (
              selectedCampaign?.assignments?.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                      {assignment.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{assignment.user?.name}</p>
                      <p className="text-[10px] text-slate-400">{assignment.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={assignment.user?.role} size="xs">
                      {assignment.user?.role}
                    </Badge>
                    {can('CAMPAIGN_ASSIGN_USER') && (
                      <button
                        onClick={() => handleRemoveUser(assignment.userId)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
