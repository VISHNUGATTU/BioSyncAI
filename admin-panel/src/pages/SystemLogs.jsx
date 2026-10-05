import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Info,
  ShieldAlert,
  Search,
  RefreshCw,
  Server,
  X,
  Code,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';

import api from '../api/axios';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Selected log modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/logs');

      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeLevel = (lvl) => {
    return (lvl || 'INFO').toUpperCase();
  };

  const getLogIcon = (level) => {
    const norm = normalizeLevel(level);
    switch (norm) {
      case 'CRITICAL':
      case 'ERROR':
        return <ShieldAlert size={15} />;
      case 'WARNING':
        return <AlertCircle size={15} />;
      default:
        return <Info size={15} />;
    }
  };

  const getLevelStyles = (level) => {
    const norm = normalizeLevel(level);
    switch (norm) {
      case 'CRITICAL':
        return {
          wrapper: 'border-red-500/25 bg-red-500/[0.12] text-red-500',
          badge: 'border-red-500/30 bg-red-500/[0.15] text-red-500',
        };
      case 'ERROR':
        return {
          wrapper: 'border-red-400/15 bg-red-400/[0.07] text-red-400',
          badge: 'border-red-400/20 bg-red-400/[0.08] text-red-400',
        };
      case 'WARNING':
        return {
          wrapper: 'border-amber-400/15 bg-amber-400/[0.07] text-amber-400',
          badge: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-400',
        };
      default:
        return {
          wrapper: 'border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400',
          badge: 'border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400',
        };
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: '—', time: '' };

    const parsedDate = new Date(timestamp);
    if (Number.isNaN(parsedDate.getTime())) return { date: '—', time: '' };

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
      const norm = normalizeLevel(log.level);

      const matchesLevel =
        levelFilter === 'All' ||
        norm === levelFilter.toUpperCase();

      const matchesSearch =
        !query ||
        log.message?.toLowerCase().includes(query) ||
        log.module?.toLowerCase().includes(query) ||
        log.endpointCalled?.toLowerCase().includes(query) ||
        log.ipAddress?.toLowerCase().includes(query);

      return matchesLevel && matchesSearch;
    });
  }, [logs, levelFilter, search]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      errors: logs.filter((l) => ['ERROR', 'CRITICAL'].includes(normalizeLevel(l.level))).length,
      warnings: logs.filter((l) => normalizeLevel(l.level) === 'WARNING').length,
      info: logs.filter((l) => normalizeLevel(l.level) === 'INFO').length,
    };
  }, [logs]);

  const copyStackTrace = () => {
    if (selectedLog?.stackTrace) {
      navigator.clipboard.writeText(selectedLog.stackTrace);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Observability Core
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            System & Audit Logs
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Real-time backend trace streams, exception logs, and telemetry execution times.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={14} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stream
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
              Total Log Entries
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <Server size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Active buffer window
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-500">
              Errors & Critical
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-400/[0.08] text-red-400">
              <ShieldAlert size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-red-500 sm:text-3xl">
            {stats.errors}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Exceptions requiring investigation
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">
              Warnings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/[0.08] text-amber-400">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-500 sm:text-3xl">
            {stats.warnings}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Non-fatal runtime warnings
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-500">
              Informational
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <Info size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-cyan-500 sm:text-3xl">
            {stats.info}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Standard lifecycle events
          </p>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'ERROR', 'WARNING', 'INFO'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setLevelFilter(level)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  levelFilter.toUpperCase() === level
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {level === 'All' ? 'All Levels' : level}
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
              placeholder="Search message, module, endpoint..."
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
                  Level & Origin
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Message Description
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Endpoint / Method
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Execution
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Timestamp
                </th>
                <th className="px-6 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Details
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />
                      <p className="text-xs font-medium text-slate-500">Streaming logs...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <Terminal size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No log entries found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Current filter does not match any telemetry events.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const norm = normalizeLevel(log.level);
                  const styles = getLevelStyles(norm);
                  const time = formatTimestamp(log.createdAt);

                  return (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Level */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${styles.wrapper}`}>
                            {getLogIcon(norm)}
                          </div>
                          <div>
                            <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
                              {norm}
                            </span>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {log.module || 'SystemCore'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Message */}
                      <td className="max-w-[340px] px-6 py-4">
                        <p className="line-clamp-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {log.message}
                        </p>
                      </td>

                      {/* Endpoint */}
                      <td className="px-6 py-4">
                        {log.endpointCalled ? (
                          <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-cyan-600 dark:text-cyan-400">{log.method || 'GET'}</span>{' '}
                            <span>{log.endpointCalled}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Internal Background</span>
                        )}
                      </td>

                      {/* Execution */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {log.executionTimeMs !== undefined ? `${log.executionTimeMs}ms` : '—'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{time.date}</p>
                        <p className="text-[10px] text-slate-400">{time.time}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-cyan-400/20 hover:text-cyan-500 dark:border-slate-800 dark:bg-slate-950"
                        >
                          <Code size={14} />
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
        {!loading && filteredLogs.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredLogs.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{logs.length}</span> entries
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Stream actively buffered
            </div>
          </div>
        )}
      </section>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${getLevelStyles(selectedLog.level).wrapper}`}>
                  {getLogIcon(selectedLog.level)}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    System Telemetry Trace
                  </h2>
                  <p className="font-mono text-xs text-slate-500">
                    ID: #{selectedLog._id} • Module: {selectedLog.module || 'SystemCore'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {/* Message */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Log Message</span>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selectedLog.message}
                </p>
              </div>

              {/* Network Context */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Level</span>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                    {normalizeLevel(selectedLog.level)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Duration</span>
                  <p className="mt-1 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {selectedLog.executionTimeMs ? `${selectedLog.executionTimeMs}ms` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Client IP</span>
                  <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedLog.ipAddress || '127.0.0.1'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400">OS / Platform</span>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedLog.osVersion || 'Cloud Engine'}
                  </p>
                </div>
              </div>

              {/* Endpoint Context */}
              {selectedLog.endpointCalled && (
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 font-mono text-xs dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">REST Endpoint: </span>
                  <strong className="text-cyan-600">{selectedLog.method || 'GET'}</strong> {selectedLog.endpointCalled}
                </div>
              )}

              {/* Stack Trace if present */}
              {selectedLog.stackTrace && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Exception Stack Trace
                    </span>
                    <button
                      type="button"
                      onClick={copyStackTrace}
                      className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-red-400">
                    {selectedLog.stackTrace}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-200/80 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;