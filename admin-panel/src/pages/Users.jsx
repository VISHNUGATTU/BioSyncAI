import React, { useState, useEffect } from 'react';
import {
  Edit,
  Eye,
  Users as UsersIcon,
  Search,
  ChevronDown,
  Mail,
  Phone,
} from 'lucide-react';

import api from '../api/axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers(filter);
  }, [filter]);

  const fetchUsers = async (statusFilter) => {
    try {
      setLoading(true);

      const query =
        statusFilter === 'All' ? '' : `?status=${statusFilter}`;

      const res = await api.get(`/admin/users${query}`);

      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400';

      case 'inactive':
        return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';

      case 'suspended':
        return 'border-red-400/15 bg-red-400/[0.08] text-red-400';

      case 'pending_verification':
        return 'border-amber-400/15 bg-amber-400/[0.08] text-amber-400';

      default:
        return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
    }
  };

  const getInitials = (user) => {
    const first = user?.firstName?.trim()?.[0] || '';
    const last = user?.lastName?.trim()?.[0] || '';

    return `${first}${last}`.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Patient Directory
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            User Management
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Manage registered patients and healthcare accounts.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
          <UsersIcon size={14} className="text-cyan-400" />
          <span>{users.length} users</span>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Registered Users
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              View and manage patient accounts
            </p>
          </div>

          <div className="relative w-full sm:w-[210px]">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700"
            >
              <option value="All">All Users</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending_Verification">
                Pending Verification
              </option>
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  ID / Patient
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Contact
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Gender
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Registered
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Status
                </th>

                <th className="px-6 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading users...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <Search size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No users found
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try changing the account status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                  >
                    {/* Patient */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-[10px] font-bold text-cyan-400">
                          {getInitials(user)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {user.firstName} {user.lastName}
                          </p>

                          <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-400 dark:text-slate-600">
                            {user._id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Mail
                            size={12}
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <span className="max-w-[220px] truncate text-xs text-slate-600 dark:text-slate-400">
                            {user.email || 'No email'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone
                            size={12}
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <span className="text-[10px] text-slate-400 dark:text-slate-600">
                            {user.phoneNumber || 'No phone number'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {user.gender || 'Not specified'}
                      </span>
                    </td>

                    {/* Registered */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                          user.accountStatus
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                        {user.accountStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="View Details"
                          aria-label={`View ${user.firstName || 'user'} details`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.07] hover:text-cyan-400 dark:text-slate-600 dark:hover:text-cyan-400"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          title="Edit"
                          aria-label={`Edit ${user.firstName || 'user'}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          <Edit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {users.length}
              </span>{' '}
              {users.length === 1 ? 'user' : 'users'}
            </p>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Directory synced
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Users;