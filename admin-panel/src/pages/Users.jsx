import React, { useState, useEffect } from 'react';
import {
  Edit,
  Eye,
  Users as UsersIcon,
  Search,
  ChevronDown,
  Mail,
  Phone,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Activity,
  TestTube2,
  Clock,
  Shield,
  Save,
  RefreshCw,
  Heart,
} from 'lucide-react';

import api from '../api/axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected User Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [accountStatus, setAccountStatus] = useState('Active');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');

  useEffect(() => {
    fetchUsers(filter);
  }, [filter]);

  const fetchUsers = async (statusFilter) => {
    try {
      setLoading(true);
      const query = statusFilter === 'All' ? '' : `?status=${statusFilter}`;
      const res = await api.get(`/admin/users${query}`);

      if (res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUser = async (user) => {
    setSelectedUser(user);
    setAccountStatus(user.accountStatus || 'Active');
    setSuspensionReason(user.suspensionReason || '');
    setStatusSuccess('');
    setLoadingDetails(true);

    try {
      const res = await api.get(`/admin/users/${user._id}`);
      if (res.data.success) {
        setUserDetails(res.data);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setUpdatingStatus(true);
      setStatusSuccess('');

      const res = await api.put(`/admin/users/${selectedUser._id}/status`, {
        accountStatus,
        suspensionReason: accountStatus === 'Suspended' ? suspensionReason : undefined,
      });

      if (res.data.success) {
        setStatusSuccess('Account status updated successfully');
        setUsers((prev) =>
          prev.map((u) => (u._id === selectedUser._id ? { ...u, accountStatus, suspensionReason } : u))
        );
        setTimeout(() => setStatusSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setUpdatingStatus(false);
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

  const filteredUsers = users.filter((u) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phoneNumber?.toLowerCase().includes(query) ||
      u._id?.toLowerCase().includes(query)
    );
  });

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
            Manage registered patients, clinical history, and healthcare accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <UsersIcon size={14} className="text-cyan-400" />
            <span>{users.length} registered patients</span>
          </div>
          <button
            type="button"
            onClick={() => fetchUsers(filter)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Active', 'Inactive', 'Suspended'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  filter === status
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
            />
            <input
              type="search"
              placeholder="Search name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient Name
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Contact
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Gender & Info
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Joined Date
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Account Status
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
                      <p className="text-xs font-medium text-slate-500">Loading patients...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <UsersIcon size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No patients found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try changing the search or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => handleOpenUser(user)}
                    className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          {getInitials(user)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {user.firstName || 'Patient'} {user.lastName || ''}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            #{user._id?.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Phone size={12} className="text-slate-400" />
                          <span>{user.phoneNumber || 'No phone'}</span>
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Mail size={11} className="text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Gender & Info */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {user.gender || 'Not specified'}
                      </span>
                      {user.bloodGroup && (
                        <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.2 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                          {user.bloodGroup}
                        </span>
                      )}
                    </td>

                    {/* Registered */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
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
                        {user.accountStatus || 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUser(user);
                          }}
                          title="View Patient Details"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/[0.08] hover:text-cyan-500 dark:hover:text-cyan-400"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUser(user);
                          }}
                          title="Edit Account Status"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
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
        {!loading && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredUsers.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{users.length}</span> patients
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Patient records synchronized
            </div>
          </div>
        )}
      </section>

      {/* Patient Details & Status Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-sm font-bold text-cyan-500">
                  {getInitials(selectedUser)}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName || ''}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Patient ID: #{selectedUser._id?.substring(0, 8)} • Phone: {selectedUser.phoneNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {statusSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  {statusSuccess}
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Account Status & Security Control
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={accountStatus}
                      onChange={(e) => setAccountStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Pending_Verification">Pending Verification</option>
                    </select>
                  </div>

                  {accountStatus === 'Suspended' && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-red-500">
                        Suspension Reason
                      </label>
                      <input
                        type="text"
                        placeholder="State reason for suspension"
                        value={suspensionReason}
                        onChange={(e) => setSuspensionReason(e.target.value)}
                        className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-red-700 outline-none dark:border-red-900/50 dark:bg-slate-950 dark:text-red-300"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-50"
                  >
                    <Save size={13} className={updatingStatus ? 'animate-spin' : ''} />
                    <span>{updatingStatus ? 'Saving...' : 'Update Account Status'}</span>
                  </button>
                </div>
              </form>

              {/* Patient Demographics & Baseline Vitals */}
              {loadingDetails ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading patient history...</div>
              ) : userDetails ? (
                <div className="space-y-4">
                  {/* Demographics Card */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Blood Group</span>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {userDetails.user?.bloodGroup || '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Gender</span>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {userDetails.user?.gender || '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Height / Weight</span>
                      <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                        {userDetails.user?.height ? `${userDetails.user.height} cm` : '—'} /{' '}
                        {userDetails.user?.weight ? `${userDetails.user.weight} kg` : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Baseline Verified</span>
                      <p className="mt-1 text-xs font-bold text-emerald-500">
                        {userDetails.user?.baselineDataVerified ? 'Verified' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Appointments History */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/30">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Appointments ({userDetails.appointments?.length || 0})
                    </h4>
                    {userDetails.appointments?.length === 0 ? (
                      <p className="text-xs text-slate-400">No scheduled appointments found.</p>
                    ) : (
                      <div className="space-y-2">
                        {userDetails.appointments.map((a) => (
                          <div key={a._id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5 last:border-0 dark:border-slate-800">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {a.appointmentType || 'Lab Visit'}
                              </span>
                              <span className="ml-2 text-slate-400">
                                {new Date(a.scheduledDate).toLocaleDateString()} ({a.timeSlot})
                              </span>
                            </div>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lab Test Samples */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/30">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Lab Test Samples ({userDetails.samples?.length || 0})
                    </h4>
                    {userDetails.samples?.length === 0 ? (
                      <p className="text-xs text-slate-400">No lab test samples recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {userDetails.samples.map((s) => (
                          <div key={s._id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5 last:border-0 dark:border-slate-800">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {s.testCatalog?.testName || 'Diagnostic Test'}
                              </span>
                              {s.barcode && <span className="ml-2 font-mono text-[10px] text-slate-400">[{s.barcode}]</span>}
                            </div>
                            <span className="rounded bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                              {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;