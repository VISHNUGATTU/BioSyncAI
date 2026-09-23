import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Info,
  ShieldAlert,
  Search,
  RefreshCw,
  Activity,
  Server,
  Clock3,
} from 'lucide-react';

import api from '../api/axios';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/logs');

      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'Error':
        return <ShieldAlert size={15} />;

      case 'Warning':
        return <AlertCircle size={15} />;

      default:
        return <Info size={15} />;
    }
  };

  const getLevelStyles = (level) => {
    switch (level) {
      case 'Error':
        return {
          wrapper:
            'border-red-400/15 bg-red-400/[0.07] text-red-400',
          badge:
            'border-red-400/20 bg-red-400/[0.08] text-red-400',
        };

      case 'Warning':
        return {
          wrapper:
            'border-amber-400/15 bg-amber-400/[0.07] text-amber-400',
          badge:
            'border-amber-400/20 bg-amber-400/[0.08] text-amber-400',
        };

      default:
        return {
          wrapper:
            'border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400',
          badge:
            'border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400',
        };
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return {
        date: '—',
        time: '',
      };
    }

    const parsedDate = new Date(timestamp);

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

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const level = log.level || 'Info';

      const matchesLevel =
        levelFilter === 'All' || level === levelFilter;

      const matchesSearch =
        !query ||
        [
          log.message,
          log.module,
          log.level,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(query)
        );

      return matchesLevel && matchesSearch;
    });
  }, [logs, levelFilter, search]);

  const errorCount = logs.filter(
    (log) => log.level === 'Error'
  ).length;

  const warningCount = logs.filter(
    (log) => log.level === 'Warning'
  ).length;

  const infoCount = logs.filter(
    (log) => !log.level || log.level === 'Info'
  ).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Infrastructure Monitoring
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            System Logs
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Monitor system events, service activity, and operational warnings.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh logs
        </button>
      </div>

      {/* Log overview */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Total */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/[0.07] blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
              <Activity size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
                Total Events
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {logs.length}
              </p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/[0.07] blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.08] text-amber-400">
              <AlertCircle size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
                Warnings
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {warningCount}
              </p>
            </div>
          </div>
        </div>

        {/* Errors */}
        <div className="relative overflow-hidden rounded-2xl border border-red-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/[0.07] blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.08] text-red-400">
              <ShieldAlert size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
                Errors
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {errorCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Logs card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Event Stream
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              Application and infrastructure activity
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Search */}
            <div className="relative sm:w-[250px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
              />
            </div>

            {/* Level filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:border-slate-700"
            >
              <option value="All">All Levels</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Error">Error</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Level
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Message
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Module
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Timestamp
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading logs...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-400">
                        <Server size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No system logs found
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        No events match the current filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const level = log.level || 'Info';
                  const styles = getLevelStyles(level);

                  const timestamp = formatTimestamp(
                    log.timestamp || log.createdAt
                  );

                  return (
                    <tr
                      key={log._id || index}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Level */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${styles.wrapper}`}
                          >
                            {getLogIcon(level)}
                          </div>

                          <span
                            className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${styles.badge}`}
                          >
                            {level}
                          </span>
                        </div>
                      </td>

                      {/* Message */}
                      <td className="max-w-[520px] px-6 py-4">
                        <p
                          className="truncate text-xs font-medium text-slate-700 dark:text-slate-300"
                          title={log.message || ''}
                        >
                          {log.message || 'No message provided'}
                        </p>
                      </td>

                      {/* Module */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Server
                            size={13}
                            className="text-slate-400 dark:text-slate-600"
                          />

                          <code className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                            {log.module || 'System'}
                          </code>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredLogs.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredLogs.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {logs.length}
              </span>{' '}
              system events
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              System monitoring active
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SystemLogs;