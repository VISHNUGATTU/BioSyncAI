import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Ticket,
  Clock3,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  User,
  Shield,
  MessageSquare,
} from 'lucide-react';

import api from '../api/axios';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Selected ticket for inspection and reply
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tickets');

      if (res.data.success) {
        setTickets(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const status = ticket.status || 'Open';
      const userName = `${ticket.user?.firstName || ''} ${
        ticket.user?.lastName || ''
      }`.trim();

      const matchesStatus =
        statusFilter === 'All' ||
        status === statusFilter ||
        (statusFilter === 'In Progress' && (status === 'In_Progress' || status === 'In Progress')) ||
        (statusFilter === 'In_Progress' && (status === 'In_Progress' || status === 'In Progress'));

      const matchesSearch =
        !query ||
        ticket._id?.toLowerCase().includes(query) ||
        userName.toLowerCase().includes(query) ||
        ticket.subject?.toLowerCase().includes(query) ||
        ticket.ticketType?.toLowerCase().includes(query) ||
        ticket.priority?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'Open').length,
      inProgress: tickets.filter(
        (ticket) => ticket.status === 'In Progress' || ticket.status === 'In_Progress'
      ).length,
      resolved: tickets.filter(
        (ticket) => ticket.status === 'Resolved' || ticket.status === 'Closed'
      ).length,
    }),
    [tickets]
  );

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return {
          text: 'text-red-400',
          bg: 'bg-red-400/[0.08]',
          border: 'border-red-400/15',
          dot: 'bg-red-400',
        };

      case 'low':
        return {
          text: 'text-blue-400',
          bg: 'bg-blue-400/[0.08]',
          border: 'border-blue-400/15',
          dot: 'bg-blue-400',
        };

      case 'medium':
      default:
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-400/[0.08]',
          border: 'border-amber-400/15',
          dot: 'bg-amber-400',
        };
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Resolved':
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-400/[0.08]',
          border: 'border-emerald-400/15',
          dot: 'bg-emerald-400',
        };

      case 'In_Progress':
      case 'In Progress':
        return {
          text: 'text-cyan-400',
          bg: 'bg-cyan-400/[0.08]',
          border: 'border-cyan-400/15',
          dot: 'bg-cyan-400',
        };

      case 'Closed':
        return {
          text: 'text-slate-400',
          bg: 'bg-slate-400/[0.08]',
          border: 'border-slate-400/15',
          dot: 'bg-slate-400',
        };

      case 'Open':
      default:
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-400/[0.08]',
          border: 'border-amber-400/15',
          dot: 'bg-amber-400',
        };
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '—';
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return '—';
    return `${parsedDate.toLocaleDateString()} ${parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setStatusMessage('');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      setUpdatingStatus(true);
      const res = await api.put(`/admin/tickets/${selectedTicket._id}/status`, {
        status: newStatus,
      });

      if (res.data.success) {
        setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
        setTickets((prev) =>
          prev.map((t) => (t._id === selectedTicket._id ? { ...t, status: newStatus } : t))
        );
        setStatusMessage(`Status updated to ${newStatus}`);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const res = await api.post(`/admin/tickets/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
      });

      if (res.data.success) {
        const updatedTicket = res.data.data;
        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t._id === selectedTicket._id ? updatedTicket : t))
        );
        setReplyText('');
        setStatusMessage('Reply posted successfully');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
              Support Operations
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Support Tickets
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Manage and resolve user complaints, questions, and support inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={14}
              className={`text-slate-500 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tickets */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
              Total Tickets
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-400/[0.08] text-violet-400">
              <Ticket size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            All registered support queries
          </p>
        </div>

        {/* Open */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">
              Open Pending
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/[0.08] text-amber-400">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-500 sm:text-3xl">
            {stats.open}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Requiring initial response
          </p>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-500">
              In Progress
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <Clock3 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-cyan-500 sm:text-3xl">
            {stats.inProgress}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Assigned & actively investigated
          </p>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
              Resolved
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
            {stats.resolved}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Successfully closed tickets
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Open', 'In_Progress', 'Resolved'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab === 'In_Progress' ? 'In Progress' : tab}
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
              placeholder="Search user, subject, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400/50 focus:bg-white focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Ticket ID
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  User
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Category
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Subject
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Priority
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Created
                </th>
                <th className="px-6 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-500 dark:border-slate-700 dark:border-t-violet-400" />
                      <p className="text-xs font-medium text-slate-500">Loading tickets...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <FileText size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No support tickets found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        No tickets match the current search or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const priority = ticket.priority || 'Medium';
                  const status = ticket.status || 'Open';
                  const priorityConfig = getPriorityConfig(priority);
                  const statusConfig = getStatusConfig(status);

                  const userName =
                    `${ticket.user?.firstName || ''} ${ticket.user?.lastName || ''}`.trim() ||
                    'Anonymous User';

                  return (
                    <tr
                      key={ticket._id}
                      onClick={() => handleOpenTicket(ticket)}
                      className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/[0.07] text-violet-400">
                            <Ticket size={14} />
                          </div>
                          <span
                            title={ticket._id}
                            className="font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400"
                          >
                            {ticket._id ? `${ticket._id.substring(0, 8)}...` : '—'}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {userName}
                        </p>
                        {ticket.user?.phoneNumber && (
                          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                            {ticket.user.phoneNumber}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                          {ticket.ticketType || 'Support'}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="max-w-[260px] px-6 py-4">
                        <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                          {ticket.subject || 'No subject'}
                        </p>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${priorityConfig.border} ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityConfig.dot}`} />
                          {priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              status === 'Open' ? 'animate-pulse ' : ''
                            }${statusConfig.dot}`}
                          />
                          {status === 'In_Progress' ? 'In Progress' : status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3 size={13} className="shrink-0 text-slate-400 dark:text-slate-600" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(ticket);
                          }}
                          title="View ticket details & conversation"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-violet-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-500 dark:hover:border-violet-400/20"
                        >
                          <MessageSquare size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredTickets.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredTickets.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{tickets.length}</span> tickets
            </p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Support queue synchronized
            </div>
          </div>
        )}
      </section>

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedTicket(null)} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/[0.08] text-violet-400">
                  <Ticket size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Ticket #{selectedTicket._id?.substring(0, 8)}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        getPriorityConfig(selectedTicket.priority).border
                      } ${getPriorityConfig(selectedTicket.priority).bg} ${
                        getPriorityConfig(selectedTicket.priority).text
                      }`}
                    >
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Category: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTicket.ticketType || 'Support'}</span> • Created {formatDateTime(selectedTicket.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable Conversation */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {/* Status Alert Banner */}
              {statusMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  {statusMessage}
                </div>
              )}

              {/* Patient / Subject Summary Card */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.user?.firstName || 'User'} {selectedTicket.user?.lastName || ''}
                    </p>
                    <p className="text-xs text-slate-500">{selectedTicket.user?.phoneNumber || selectedTicket.user?.email || 'No contact specified'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <select
                        value={selectedTicket.status || 'Open'}
                        disabled={updatingStatus}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Open">Open</option>
                        <option value="In_Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                      {updatingStatus && <RefreshCw size={13} className="animate-spin text-slate-400" />}
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-200/60 pt-3 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Messages Thread */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <MessageSquare size={13} />
                  Conversation Thread ({selectedTicket.messages?.length || 0})
                </h3>

                <div className="space-y-3">
                  {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
                      No replies logged yet. Use the reply box below to send a response.
                    </div>
                  ) : (
                    selectedTicket.messages.map((msg, index) => {
                      const isAdmin = msg.senderRole === 'Admin' || msg.senderRole === 'Support_Staff' || msg.senderRole === 'SuperAdmin';
                      return (
                        <div
                          key={index}
                          className={`flex gap-3 rounded-xl p-3.5 ${
                            isAdmin
                              ? 'border border-violet-400/20 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-950/20'
                              : 'border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/60'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isAdmin
                                ? 'bg-violet-500 text-white'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {isAdmin ? <Shield size={14} /> : <User size={14} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {msg.senderName || (isAdmin ? 'Support Team' : 'User')}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                    isAdmin
                                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  {msg.senderRole || 'User'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {formatDateTime(msg.createdAt)}
                              </span>
                            </div>

                            <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer: Reply Input */}
            <form onSubmit={handleSendReply} className="border-t border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/30">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Post Administrator Response
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  required
                  placeholder="Type a response to this support ticket..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-500 disabled:opacity-50"
                >
                  <Send size={14} className={sendingReply ? 'animate-pulse' : ''} />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;