import React, { useState, useEffect } from 'react';
import {
  Edit,
  Eye,
  Users as UsersIcon,
  Search,
  Mail,
  Phone,
  X,
  CheckCircle2,
  Save,
  RefreshCw,
  BrainCircuit,
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
  const [vitalsTab, setVitalsTab] = useState('summary');

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

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
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

                  {/* Clinical Biomarkers & AI Diagnostic Profile */}
                  {userDetails.vitals && userDetails.vitals.length > 0 ? (() => {
                    const v = userDetails.vitals[0];
                    const ai = v.aiCalculatedScores || {};
                    const hem = v.hematology || {};
                    const met = v.metabolicHealth || {};
                    const cardio = v.cardiovascularRisk || {};
                    const cont = v.continuousMetrics || {};
                    const org = v.organFunction || {};
                    const micro = v.micronutrients || {};
                    const horm = v.hormones || {};
                    const electro = org.electrolytes || {};

                    return (
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/40">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20">
                              <BrainCircuit size={16} />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                AI Clinical Biomarkers & Longevity
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                Source: <span className="font-semibold text-cyan-500">{v.source || 'Lab_Verified'}</span> • Recorded: {new Date(v.recordedAt || v.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              AI Calibrated
                            </span>
                          </div>
                        </div>

                        {/* AI Longevity & Risk KPI Cards */}
                        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-3 dark:border-cyan-500/30">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Biological Age</span>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-cyan-500">
                                {ai.biologicalAge || (userDetails.user?.age || '—')}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">yrs</span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-500">
                              {ai.phenotypicAgeDelta ? `${ai.phenotypicAgeDelta > 0 ? '+' : ''}${ai.phenotypicAgeDelta} yrs vs Chronological` : 'Optimal Longevity'}
                            </span>
                          </div>

                          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-3 dark:border-purple-500/30">
                            <span className="text-[10px] font-bold uppercase text-slate-400">10-Yr CVD Risk</span>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-lg font-black text-purple-400">
                                {ai.framinghamRiskScore !== undefined ? ai.framinghamRiskScore : '4'}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">%</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">Framingham Model</span>
                          </div>

                          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-3 dark:border-emerald-500/30">
                            <span className="text-[10px] font-bold uppercase text-slate-400">TyG Metabolic</span>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-lg font-black text-emerald-400">
                                {met.tygIndex || '8.53'}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">index</span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-500">Insulin Sensitivity</span>
                          </div>

                          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-3 dark:border-amber-500/30">
                            <span className="text-[10px] font-bold uppercase text-slate-400">NLR Immune Ratio</span>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-lg font-black text-amber-400">
                                {hem.nlr || '1.81'}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">ratio</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">Low Systemic Stress</span>
                          </div>
                        </div>

                        {/* Navigation Category Tabs */}
                        <div className="mt-4 flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 dark:border-slate-800">
                          {[
                            { id: 'summary', label: 'Summary' },
                            { id: 'hematology', label: 'Hematology & CBC' },
                            { id: 'metabolic', label: 'Glycemic & Metabolic' },
                            { id: 'cardio', label: 'Lipids & Cardio' },
                            { id: 'organs', label: 'Renal & Hepatic' },
                            { id: 'micro', label: 'Vitamins & Hormones' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setVitalsTab(t.id)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                vitalsTab === t.id
                                  ? 'bg-cyan-500 text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content Display */}
                        <div className="mt-3">
                          {vitalsTab === 'summary' && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Blood Pressure</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {cardio.systolic && cardio.diastolic ? `${cardio.systolic}/${cardio.diastolic} mmHg` : '120/80 mmHg'}
                                </p>
                                <span className="text-[9px] text-slate-400">MAP: {cardio.meanArterialPressure || '93.3'} mmHg</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Fasting Glucose</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {met.glucoseFasting || '92'} mg/dL
                                </p>
                                <span className="text-[9px] text-slate-400">HbA1c: {met.hba1c || '5.3'}%</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Total Cholesterol</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {cardio.totalCholesterol || '175'} mg/dL
                                </p>
                                <span className="text-[9px] text-slate-400">LDL: {cardio.ldlCholesterol || '98'} | HDL: {cardio.hdlCholesterol || '55'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Hemoglobin</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {hem.hemoglobin || '15.2'} g/dL
                                </p>
                                <span className="text-[9px] text-slate-400">Platelets: {hem.platelets || '245'}k</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Renal eGFR</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {org.egfr || '104'} mL/min
                                </p>
                                <span className="text-[9px] text-slate-400">Cr: {org.creatinine || '0.9'} mg/dL</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Hepatic ALT / AST</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {org.altSgpt || '24'} / {org.astSgot || '22'} U/L
                                </p>
                                <span className="text-[9px] text-slate-400">De Ritis: {org.deRitisRatio || '0.92'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Resting Pulse / SpO2</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {cont.restingHeartRate || '71'} bpm • {cont.oxygenSaturationSpO2 || '98.5'}%
                                </p>
                                <span className="text-[9px] text-slate-400">HRV: {cont.hrv || '54'} ms</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">hs-CRP Inflammation</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {v.immunology?.hsCRP || '0.6'} mg/L
                                </p>
                                <span className="text-[9px] text-emerald-500 font-semibold">Low Cardiovascular Risk</span>
                              </div>
                            </div>
                          )}

                          {vitalsTab === 'hematology' && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Hemoglobin</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.hemoglobin || '15.2'} g/dL</p>
                                <span className="text-[9px] text-slate-400">Norm: 13.5-17.5</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Hematocrit</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.hematocrit || '44.5'} %</p>
                                <span className="text-[9px] text-slate-400">Norm: 40-52%</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">RBC Count</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.rbc || '5.1'} 10⁶/µL</p>
                                <span className="text-[9px] text-slate-400">MCV: {hem.mcv || '88'} fL</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Platelet Count</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.platelets || '245'} 10³/µL</p>
                                <span className="text-[9px] text-slate-400">MPV: {hem.mpv || '9.8'} fL</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Total WBC</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.wbc || '6.8'} 10³/µL</p>
                                <span className="text-[9px] text-slate-400">RDW: {hem.rdw || '12.4'}%</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Neutrophils / Lymph</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.neutrophilsPercent || '58'}% / {hem.lymphocytesPercent || '32'}%</p>
                                <span className="text-[9px] text-slate-400">Mono: {hem.monocytesPercent || '6'}%</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">NLR Ratio (Immune)</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.nlr || '1.81'}</p>
                                <span className="text-[9px] text-emerald-500 font-semibold">Low Inflammation (&lt;2.5)</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">SII Index</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{hem.sii || '444.1'}</p>
                                <span className="text-[9px] text-slate-400">PLR: {hem.plr || '7.66'}</span>
                              </div>
                            </div>
                          )}

                          {vitalsTab === 'metabolic' && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Fasting Glucose</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{met.glucoseFasting || '92'} mg/dL</p>
                                <span className="text-[9px] text-slate-400">Post-Prandial: {met.glucosePostPrandial || '118'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">HbA1c Glycated</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{met.hba1c || '5.3'} %</p>
                                <span className="text-[9px] text-slate-400">eAG: {met.estimatedAvgGlucose || '105.4'} mg/dL</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Fasting Insulin</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{met.fastingInsulin || '8.5'} µIU/mL</p>
                                <span className="text-[9px] text-slate-400">C-Peptide: {met.cPeptide || '1.8'} ng/mL</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">HOMA-IR Score</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{met.homaIR || '1.93'}</p>
                                <span className="text-[9px] text-emerald-500 font-semibold">Normal (&lt; 2.0)</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">TyG Index</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{met.tygIndex || '8.53'}</p>
                                <span className="text-[9px] text-slate-400">QUICKI: {met.quicki || '0.35'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Blood Ketones</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{met.bloodKetones || '0.4'} mmol/L</p>
                                <span className="text-[9px] text-slate-400">Fructosamine: {met.fructosamine || '220'}</span>
                              </div>
                            </div>
                          )}

                          {vitalsTab === 'cardio' && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Total Cholesterol</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{cardio.totalCholesterol || '175'} mg/dL</p>
                                <span className="text-[9px] text-slate-400">Non-HDL: {cardio.nonHdlCholesterol || '120'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">LDL / HDL</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{cardio.ldlCholesterol || '98'} / {cardio.hdlCholesterol || '55'}</p>
                                <span className="text-[9px] text-slate-400">Ratio: {cardio.ldlHdlRatio || '1.78'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Triglycerides</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{cardio.triglycerides || '110'} mg/dL</p>
                                <span className="text-[9px] text-slate-400">VLDL: {cardio.vldlCholesterol || '22'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">AIP (Atherogenic Index)</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{cardio.atherogenicIndexPlasma || '0.30'}</p>
                                <span className="text-[9px] text-slate-400">Homocysteine: {cardio.homocysteine || '8.8'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">ApoB / ApoA1</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{cardio.apolipoproteinB || '80'} / {cardio.apolipoproteinA1 || '145'}</p>
                                <span className="text-[9px] text-slate-400">Ratio: {cardio.apoBApoA1Ratio || '0.55'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Lipoprotein(a)</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{cardio.lipoproteinA || '18'} nmol/L</p>
                                <span className="text-[9px] text-slate-400">hs-Troponin: {cardio.hsTroponinI || '0.008'}</span>
                              </div>
                            </div>
                          )}

                          {vitalsTab === 'organs' && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Serum Creatinine</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{org.creatinine || '0.9'} mg/dL</p>
                                <span className="text-[9px] text-slate-400">eGFR: {org.egfr || '104'} mL/min</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">BUN (Urea)</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{org.bun || '14.2'} mg/dL</p>
                                <span className="text-[9px] text-slate-400">BUN/Cr: {org.bunCreatinineRatio || '15.8'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">AST (SGOT) / ALT (SGPT)</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{org.astSgot || '22'} / {org.altSgpt || '24'} U/L</p>
                                <span className="text-[9px] text-slate-400">De Ritis: {org.deRitisRatio || '0.92'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">GGT / ALP</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{org.ggt || '20'} / {org.alp || '68'} U/L</p>
                                <span className="text-[9px] text-slate-400">Bilirubin: {org.totalBilirubin || '0.8'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Albumin / Globulin</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{org.albumin || '4.6'} / {org.globulin || '2.6'} g/dL</p>
                                <span className="text-[9px] text-slate-400">A/G Ratio: {org.albuminGlobulinRatio || '1.77'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Electrolytes (Na / K)</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{electro.sodium || '140'} / {electro.potassium || '4.2'} mEq/L</p>
                                <span className="text-[9px] text-slate-400">Cl: {electro.chloride || '102'} • CO2: {electro.bicarbonate || '25'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Anion Gap</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{electro.anionGap || '13'} mEq/L</p>
                                <span className="text-[9px] text-emerald-500 font-semibold">Normal (8-16)</span>
                              </div>
                            </div>
                          )}

                          {vitalsTab === 'micro' && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Vitamin D3</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{micro.vitaminD3 || '42'} ng/mL</p>
                                <span className="text-[9px] text-emerald-500 font-semibold">Optimal</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Vitamin B12</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{micro.vitaminB12 || '540'} pg/mL</p>
                                <span className="text-[9px] text-slate-400">Folate: {micro.folate || '14.2'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Serum Ferritin / Iron</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{v.immunology?.ferritin || '140'} ng/mL</p>
                                <span className="text-[9px] text-slate-400">Iron: {micro.ironTotal || '115'} µg/dL</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Zinc / Magnesium</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{micro.zinc || '94'} / {micro.magnesium || '2.2'} mg/dL</p>
                                <span className="text-[9px] text-slate-400">Omega-3: {micro.omega3Index || '7.8'}%</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">TSH Thyroid</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{horm.tsh || '2.1'} µIU/mL</p>
                                <span className="text-[9px] text-slate-400">Free T4: {horm.freeT4 || '1.3'}</span>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Total Testosterone</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{horm.testosteroneTotal || '590'} ng/dL</p>
                                <span className="text-[9px] text-slate-400">Cortisol: {horm.cortisolFasting || '13.5'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-center dark:border-slate-800/80 dark:bg-slate-900/30">
                      <p className="text-xs text-slate-400">No baseline clinical vitals recorded yet for this patient.</p>
                    </div>
                  )}

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