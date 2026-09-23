import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  RefreshCw,
  Clock3,
  Activity,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

import api from '../api/axios';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [severityFilter, setSeverityFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/dashboard/alerts');

      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const severity = alert.severity || 'Medium';
      const type = alert.type || 'System Alert';
      const description = alert.description || alert.message || '';

      const matchesSeverity =
        severityFilter === 'All' || severity === severityFilter;

      const matchesSearch =
        !query ||
        severity.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query);

      return matchesSeverity && matchesSearch;
    });
  }, [alerts, severityFilter, search]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      high: alerts.filter((alert) => alert.severity === 'High').length,
      medium: alerts.filter((alert) => alert.severity === 'Medium').length,
      low: alerts.filter((alert) => alert.severity === 'Low').length,
    };
  }, [alerts]);

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'High':
        return {
          icon: ShieldAlert,
          text: 'text-red-400',
          bg: 'bg-red-400/[0.08]',
          border: 'border-red-400/15',
          iconBg: 'bg-red-400/[0.08]',
          dot: 'bg-red-400',
        };

      case 'Low':
        return {
          icon: AlertCircle,
          text: 'text-blue-400',
          bg: 'bg-blue-400/[0.08]',
          border: 'border-blue-400/15',
          iconBg: 'bg-blue-400/[0.08]',
          dot: 'bg-blue-400',
        };

      case 'Medium':
      default:
        return {
          icon: AlertTriangle,
          text: 'text-amber-400',
          bg: 'bg-amber-400/[0.08]',
          border: 'border-amber-400/15',
          iconBg: 'bg-amber-400/[0.08]',
          dot: 'bg-amber-400',
        };
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return {
        date: '—',
        time: '',
      };
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return {
        date: '—',
        time: '',
      };
    }

    return {
      date: parsedDate.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: parsedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 dark:text-red-400">
              Incident Monitoring
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Critical Alerts & Escalations
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Monitor system alerts, priority incidents, and issues requiring
            attention.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAlerts}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh alerts
        </button>
      </div>

      {/* Alert overview */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-400/15 bg-slate-400/[0.08] text-slate-400">
              <Activity size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Total Alerts
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              {stats.total}
            </p>
          </div>
        </div>

        {/* High */}
        <div className="relative overflow-hidden rounded-2xl border border-red-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.08] text-red-400">
              <ShieldAlert size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              High Severity
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-red-400">
              {stats.high}
            </p>
          </div>
        </div>

        {/* Medium */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.08] text-amber-400">
              <AlertTriangle size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Medium Severity
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-amber-400">
              {stats.medium}
            </p>
          </div>
        </div>

        {/* Low */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-400">
              <AlertCircle size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Low Severity
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-blue-400">
              {stats.low}
            </p>
          </div>
        </div>
      </section>

      {/* Alerts table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Active Alerts
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                {filteredAlerts.length} alert
                {filteredAlerts.length !== 1 ? 's' : ''} currently shown
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative sm:w-[260px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search alerts..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-red-400/50 focus:bg-white focus:ring-4 focus:ring-red-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Severity */}
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-red-400/50 focus:ring-4 focus:ring-red-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[150px]"
                >
                  <option value="All">All Severities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
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
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Severity
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Type
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Description
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Timestamp
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-red-400 dark:border-slate-700 dark:border-t-red-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading alerts...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-400">
                        <Activity size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No active alerts
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        The system currently has no alerts matching your
                        filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, index) => {
                  const severity = alert.severity || 'Medium';
                  const config = getSeverityConfig(severity);
                  const SeverityIcon = config.icon;

                  const timestamp = formatDate(
                    alert.createdAt || alert.timestamp
                  );

                  return (
                    <tr
                      key={alert._id || index}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Severity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.border} ${config.iconBg} ${config.text}`}
                          >
                            <SeverityIcon size={16} />
                          </div>

                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${config.border} ${config.bg} ${config.text}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                              />
                              {severity}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {alert.type || 'System Alert'}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                          Incident event
                        </p>
                      </td>

                      {/* Description */}
                      <td className="max-w-[420px] px-6 py-4">
                        <p className="line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                          {alert.description ||
                            alert.message ||
                            'No description provided.'}
                        </p>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={13}
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {timestamp.date}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                              {timestamp.time}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/15 bg-amber-400/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                          Action Required
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredAlerts.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredAlerts.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {alerts.length}
              </span>{' '}
              alerts
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              Alert monitoring active
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Alerts;