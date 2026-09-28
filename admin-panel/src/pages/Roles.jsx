import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Users,
  KeyRound,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

import api from '../api/axios';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal and action states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentRole, setCurrentRole] = useState({ name: '', description: '', permissions: {} });
  const [toast, setToast] = useState(null);

  const defaultPermissions = {
    dashboard: false,
    users: false,
    roles: false,
    reports: false,
    settings: false,
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (role) => {
    setModalMode('edit');
    setCurrentRole({ 
      _id: role._id, 
      name: role.name || '', 
      description: role.description || '', 
      permissions: role.permissions || defaultPermissions,
      isSystem: role.isSystem 
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setModalMode('create');
    setCurrentRole({ name: '', description: '', permissions: defaultPermissions });
    setIsModalOpen(true);
  };

  const handleDelete = async (role) => {
    if (role.isSystem) {
      alert("System roles cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        const res = await api.delete(`/admin/roles/${role._id}`);
        if (res.data.success) {
          setRoles(prev => prev.filter(r => r._id !== role._id));
          showToast('Role deleted successfully.');
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentRole.name.trim()) return;

    try {
      if (modalMode === 'create') {
        const res = await api.post('/admin/roles', currentRole);
        if (res.data.success) {
          setRoles(prev => [...prev, { ...res.data.data, users: 0 }]);
          showToast('Role created successfully.');
        }
      } else {
        const res = await api.put(`/admin/roles/${currentRole._id}`, currentRole);
        if (res.data.success) {
          setRoles(prev => prev.map(r => r._id === currentRole._id ? { ...res.data.data, users: r.users } : r));
          showToast('Role updated successfully.');
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save role');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/roles');

      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return roles;

    return roles.filter((role) => {
      return (
        role.name?.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
      );
    });
  }, [roles, search]);

  const totalMembers = useMemo(() => {
    return roles.reduce((total, role) => {
      const count = Number(role.users);

      return total + (Number.isFinite(count) ? count : 0);
    }, 0);
  }, [roles]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check size={12} strokeWidth={3} />
          </div>
          {toast}
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
              Access Control
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Roles & Permissions
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Manage RBAC policies and administrator access privileges.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRoles}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh roles
        </button>
      </div>

      {/* Overview cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-violet-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/[0.07] blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-400">
              <ShieldCheck size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
                Defined Roles
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {roles.length}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/[0.07] blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
              <Users size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
                Assigned Members
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {totalMembers}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Administrator Roles
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              Configure access boundaries for administrative accounts
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-[260px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400/50 focus:bg-white focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
              />
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-xs font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,0.12)] transition-all hover:bg-violet-400"
            >
              <KeyRound size={14} />
              Create New Role
            </button>
          </div>
        </div>

        {/* Role table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Role Identity
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Access Level Summary
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Assigned Members
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-400 dark:border-slate-700 dark:border-t-violet-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading roles...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.06] text-violet-400">
                        <ShieldCheck size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No roles found
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        No roles match the current search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role, index) => (
                  <tr
                    key={role.name || index}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                  >
                    {/* Role */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-400">
                          <ShieldCheck size={17} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {role.name || 'Unnamed Role'}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                            Administrative access role
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Access */}
                    <td className="max-w-[420px] px-6 py-5">
                      <div className="flex items-start gap-2">
                        <ChevronRight
                          size={13}
                          className="mt-0.5 shrink-0 text-violet-400"
                        />
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs font-semibold leading-5 text-slate-800 dark:text-slate-200">
                            {role.description || 'No description provided.'}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {role.permissions && Object.entries(role.permissions).map(([key, val]) => val && (
                              <span key={key} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Users */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Users
                          size={14}
                          className="text-slate-400 dark:text-slate-600"
                        />

                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {role.users ?? 0}
                        </span>

                        <span className="text-[10px] text-slate-400 dark:text-slate-600">
                          admins
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="Edit Permissions"
                          onClick={() => handleEdit(role)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-violet-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-500 dark:hover:border-violet-400/20"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          type="button"
                          title={role.isSystem ? "System Roles cannot be deleted" : "Delete Role"}
                          disabled={role.isSystem}
                          onClick={() => handleDelete(role)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all ${
                            role.isSystem 
                              ? 'cursor-not-allowed opacity-40' 
                              : 'hover:border-red-400/30 hover:bg-red-400/[0.06] hover:text-red-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-500 dark:hover:border-red-400/20'
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredRoles.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredRoles.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {roles.length}
              </span>{' '}
              roles
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              RBAC configuration
            </div>
          </div>
        )}
      </section>

      {/* Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {modalMode === 'create' ? 'Create New Role' : 'Edit Role'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Role Name
                </label>
                <input
                  type="text"
                  required
                  disabled={currentRole.isSystem}
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                  placeholder="e.g., Compliance Officer"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Description
                </label>
                <textarea
                  required
                  value={currentRole.description}
                  onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                  placeholder="Describe the privileges this role has..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Module Permissions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(currentRole.permissions || {}).map((mod) => (
                    <label key={mod} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={currentRole.permissions[mod]}
                        onChange={(e) => setCurrentRole({
                          ...currentRole,
                          permissions: { ...currentRole.permissions, [mod]: e.target.checked }
                        })}
                        className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-xs font-medium capitalize text-slate-700 dark:text-slate-300">
                        {mod}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet-500 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-violet-400 active:scale-[0.98]"
                >
                  {modalMode === 'create' ? 'Create Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;