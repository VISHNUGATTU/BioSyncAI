import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Navigation,
  Search,
  TestTube2,
  UserRound,
  UserRoundCog,
  Clock3,
  RefreshCw,
  ChevronDown,
  Activity,
} from 'lucide-react';

import api from '../api/axios';

const Samples = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/dashboard/sample-pipeline');

      if (res.data.success) {
        setSamples(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = useMemo(() => {
    const query = search.toLowerCase().trim();

    return samples.filter((sample) => {
      const patientName = `${sample.user?.firstName || ''} ${
        sample.user?.lastName || ''
      }`.trim();

      const testName = sample.testCatalog?.testName || '';
      const assistantName = sample.labAssistant?.name || '';
      const trackingId = sample.sampleTrackingId || '';

      const matchesSearch =
        !query ||
        patientName.toLowerCase().includes(query) ||
        testName.toLowerCase().includes(query) ||
        assistantName.toLowerCase().includes(query) ||
        trackingId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'All' || sample.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [samples, search, statusFilter]);

  const statusStats = useMemo(() => {
    return {
      total: samples.length,
      requested: samples.filter(
        (sample) => sample.status === 'Requested'
      ).length,
      collected: samples.filter(
        (sample) => sample.status === 'Sample_Collected'
      ).length,
      processing: samples.filter(
        (sample) =>
          sample.status === 'Processing' ||
          sample.status === 'At_Laboratory'
      ).length,
      completed: samples.filter(
        (sample) => sample.status === 'Report_Generated'
      ).length,
    };
  }, [samples]);

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Requested':
        return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';

      case 'Assigned':
        return 'border-amber-400/15 bg-amber-400/[0.08] text-amber-400';

      case 'Sample_Collected':
        return 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400';

      case 'At_Laboratory':
        return 'border-blue-400/15 bg-blue-400/[0.08] text-blue-400';

      case 'Processing':
        return 'border-violet-400/15 bg-violet-400/[0.08] text-violet-400';

      case 'Report_Generated':
        return 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400';

      default:
        return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Requested':
        return 'bg-slate-400';

      case 'Assigned':
        return 'bg-amber-400';

      case 'Sample_Collected':
        return 'bg-emerald-400';

      case 'At_Laboratory':
        return 'bg-blue-400';

      case 'Processing':
        return 'bg-violet-400';

      case 'Report_Generated':
        return 'bg-cyan-400';

      default:
        return 'bg-slate-400';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';

    return status
      .split('_')
      .map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
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
      }),
    };
  };

  const getInitials = (name, fallback = 'NA') => {
    const parts = name?.trim()?.split(/\s+/) || [];

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return name?.slice(0, 2).toUpperCase() || fallback;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Sample Operations
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Sample Tracking
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Monitor sample collection and processing throughout the diagnostic
            lifecycle.
          </p>
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="min-w-[100px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">
              Total
            </p>

            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-200">
              {statusStats.total}
            </p>
          </div>

          <div className="min-w-[100px] rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/70">
              Collected
            </p>

            <p className="mt-1 text-lg font-semibold tracking-tight text-emerald-400">
              {statusStats.collected}
            </p>
          </div>

          <div className="min-w-[100px] rounded-xl border border-violet-400/10 bg-violet-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-violet-500/70">
              Processing
            </p>

            <p className="mt-1 text-lg font-semibold tracking-tight text-violet-400">
              {statusStats.processing}
            </p>
          </div>

          <div className="min-w-[100px] rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500/70">
              Completed
            </p>

            <p className="mt-1 text-lg font-semibold tracking-tight text-cyan-400">
              {statusStats.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Sample Pipeline
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                {filteredSamples.length} sample
                {filteredSamples.length !== 1 ? 's' : ''} currently shown
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
                  placeholder="Search samples..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[170px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Requested">Requested</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Sample_Collected">Collected</option>
                  <option value="At_Laboratory">At Laboratory</option>
                  <option value="Processing">Processing</option>
                  <option value="Report_Generated">
                    Report Generated
                  </option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={fetchSamples}
                disabled={loading}
                title="Refresh samples"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-300"
              >
                <RefreshCw
                  size={15}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Sample
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Test
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Assigned To
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Status
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Last Updated
                </th>

                <th className="px-6 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading sample pipeline...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <TestTube2 size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No samples found
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try changing the search or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => {
                  const patientName =
                    `${sample.user?.firstName || ''} ${
                      sample.user?.lastName || ''
                    }`.trim() || 'N/A';

                  const assistantName =
                    sample.labAssistant?.name || 'Unassigned';

                  const testName =
                    sample.testCatalog?.testName || 'Unknown Test';

                  const updated = formatDate(sample.updatedAt);

                  return (
                    <tr
                      key={sample._id}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Sample */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400">
                            <TestTube2 size={16} />

                            {sample.status === 'Processing' && (
                              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {sample.sampleTrackingId || 'Unknown'}
                            </p>

                            <p className="mt-0.5 max-w-[180px] truncate font-mono text-[9px] text-slate-400 dark:text-slate-600">
                              {sample._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08] text-[9px] font-bold text-blue-400">
                            {getInitials(patientName, 'PT')}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {patientName}
                            </p>

                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600">
                              <UserRound size={10} />
                              Patient
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Test */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Activity
                            size={13}
                            className="text-slate-400 dark:text-slate-600"
                          />

                          <span className="max-w-[190px] truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                            {testName}
                          </span>
                        </div>
                      </td>

                      {/* Assistant */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[8px] font-bold ${
                              sample.labAssistant
                                ? 'bg-emerald-400/[0.08] text-emerald-400'
                                : 'bg-slate-400/[0.07] text-slate-500'
                            }`}
                          >
                            <UserRoundCog size={13} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                              {assistantName}
                            </p>

                            {!sample.labAssistant && (
                              <p className="mt-0.5 text-[10px] text-amber-500">
                                Awaiting assignment
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                            sample.status
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                              sample.status
                            )}`}
                          />

                          {formatStatus(sample.status)}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={13}
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {updated.date}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                              {updated.time}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            title="Track sample"
                            aria-label={`Track ${sample.sampleTrackingId}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.07] hover:text-cyan-400 dark:text-slate-600 dark:hover:text-cyan-400"
                          >
                            <Navigation size={15} />
                          </button>

                          <button
                            type="button"
                            title="View details"
                            aria-label={`View details for ${sample.sampleTrackingId}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                          >
                            <FileText size={15} />
                          </button>
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
        {!loading && filteredSamples.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredSamples.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {samples.length}
              </span>{' '}
              samples
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Pipeline synchronized
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Samples;