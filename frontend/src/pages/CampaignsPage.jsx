import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  X
} from 'lucide-react';

export const CampaignsPage = () => {
  const { tenant, can, hasRole } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    startDate: '',
    endDate: ''
  });

  // Assign user modal states
  const [tenantUsers, setTenantUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const fetchTenantUsers = async () => {
    try {
      const response = await apiClient.get('/users?limit=100');
      if (response.data.success) {
        setTenantUsers(response.data.data);
      }
    } catch (e) {
      console.warn('Could not fetch tenant users for assignment:', e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [pagination.page, statusFilter, tenant?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
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
      // Refresh current campaign assignments
      const updated = await apiClient.get(`/campaigns/${selectedCampaign.id}`);
      setSelectedCampaign(updated.data.data);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign user.');
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await apiClient.delete(`/campaigns/${selectedCampaign.id}/assign/${userId}`);
      const updated = await apiClient.get(`/campaigns/${selectedCampaign.id}`);
      setSelectedCampaign(updated.data.data);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Campaigns</h1>
          <p className="text-xs text-slate-400 mt-1">
            Phishing drills, compliance assessments, and vulnerability sweeps for{' '}
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
            placeholder="Search campaigns by name or details..."
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

      {/* Campaigns Table / Cards */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No campaigns found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Campaign Name & Description</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Assigned Team</th>
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
                        Created by: {camp.createdBy?.name || 'System'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge variant={camp.status}>{camp.status}</Badge>
                    </td>

                    <td className="px-5 py-3.5 text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'N/A'} -{' '}
                          {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'N/A'}
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
                      <div className="flex items-center justify-end gap-1.5">
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
              Description
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
        title={`Assigned Members - ${selectedCampaign?.name}`}
      >
        <div className="space-y-4">
          {/* Add member form */}
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign</span>
              </button>
            </form>
          )}

          {/* Current assignments list */}
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
