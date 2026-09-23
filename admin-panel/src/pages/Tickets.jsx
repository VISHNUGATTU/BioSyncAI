import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Ticket,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

import api from '../api/axios';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/tickets');

      if (res.data.success) {
        setTickets(res.data.data);
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
        statusFilter === 'All' || status === statusFilter;

      const matchesSearch =
        !query ||
        ticket._id?.toLowerCase().includes(query) ||
        userName.toLowerCase().includes(query) ||
        ticket.subject?.toLowerCase().includes(query) ||
        ticket.priority?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'Open').length,
      inProgress: tickets.filter(
        (ticket) => ticket.status === 'In Progress'
      ).length,
      resolved: tickets.filter((ticket) => ticket.status === 'Resolved')
        .length,
    }),
    [tickets]
  );

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
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

      case 'In Progress':
        return {
          text: 'text-cyan-400',
          bg: 'bg-cyan-400/[0.08]',
          border: 'border-cyan-400/15',
          dot: 'bg-cyan-400',
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
            Manage and resolve user complaints, questions, and support
            requests.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTickets}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh tickets
        </button>
      </div>

      {/* Overview */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-400">
              <Ticket size={18} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Total Tickets
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Open */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.08] text-amber-400">
              <AlertCircle size={18} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Open
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-amber-400">
              {stats.open}
            </p>
          </div>
        </div>

        {/* In progress */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
              <Clock3 size={18} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              In Progress
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-cyan-400">
              {stats.inProgress}
            </p>
          </div>
        </div>

        {/* Resolved */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400">
              <CheckCircle2 size={18} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Resolved
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-emerald-400">
              {stats.resolved}
            </p>
          </div>
        </div>
      </section>

      {/* Tickets */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Ticket Queue
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                {filteredTickets.length} ticket
                {filteredTickets.length !== 1 ? 's' : ''} currently shown
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative sm:w-[280px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400/50 focus:bg-white focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[155px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Ticket ID
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  User
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
                  Date
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-400 dark:border-slate-700 dark:border-t-violet-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading tickets...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.06] text-violet-400">
                        <Ticket size={18} />
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
                    `${ticket.user?.firstName || ''} ${
                      ticket.user?.lastName || ''
                    }`.trim() || 'Unknown';

                  return (
                    <tr
                      key={ticket._id}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
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
                            {ticket._id
                              ? `${ticket._id.substring(0, 8)}...`
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {userName}
                        </p>

                        {ticket.user?.email && (
                          <p className="mt-0.5 max-w-[190px] truncate text-[10px] text-slate-400 dark:text-slate-600">
                            {ticket.user.email}
                          </p>
                        )}
                      </td>

                      {/* Subject */}
                      <td className="max-w-[320px] px-6 py-4">
                        <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                          {ticket.subject || 'No subject'}
                        </p>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${priorityConfig.border} ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${priorityConfig.dot}`}
                          />

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

                          {status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={13}
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          title="View ticket"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-violet-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-500 dark:hover:border-violet-400/20"
                        >
                          <FileText size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredTickets.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredTickets.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {tickets.length}
              </span>{' '}
              tickets
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Support queue synchronized
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Tickets;