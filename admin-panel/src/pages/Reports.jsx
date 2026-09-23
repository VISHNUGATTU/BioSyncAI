import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  Search,
  FileText,
  Clock3,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  Activity,
} from 'lucide-react';

import api from '../api/axios';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/reports');

      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const patientName =
        `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim();

      const testName = report.testCatalog?.testName || '';
      const reportId = report._id || '';

      const matchesSearch =
        !query ||
        patientName.toLowerCase().includes(query) ||
        testName.toLowerCase().includes(query) ||
        reportId.toLowerCase().includes(query);

      const reportStatus =
        report.status === 'Report_Generated' ? 'Ready' : 'Processing';

      const matchesStatus =
        statusFilter === 'All' || reportStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const stats = useMemo(() => {
    const ready = reports.filter(
      (report) => report.status === 'Report_Generated'
    ).length;

    const processing = reports.length - ready;

    return {
      total: reports.length,
      ready,
      processing,
    };
  }, [reports]);

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

  const getPatientInitials = (firstName, lastName) => {
    const first = firstName?.trim()?.[0] || '';
    const last = lastName?.trim()?.[0] || '';

    return `${first}${last}`.toUpperCase() || 'PT';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Clinical Intelligence
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Patient Medical Reports
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Review, monitor, and dispatch AI-generated diagnostic reports.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="min-w-[100px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">
              Total
            </p>

            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-200">
              {stats.total}
            </p>
          </div>

          <div className="min-w-[100px] rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/70">
              Ready
            </p>

            <p className="mt-1 text-lg font-semibold tracking-tight text-emerald-400">
              {stats.ready}
            </p>
          </div>

          <div className="min-w-[100px] rounded-xl border border-violet-400/10 bg-violet-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-violet-500/70">
              Processing
            </p>

            <p className="mt-1 text-lg font-semibold tracking-tight text-violet-400">
              {stats.processing}
            </p>
          </div>
        </div>
      </div>

      {/* Reports card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Diagnostic Reports
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                {filteredReports.length} report
                {filteredReports.length !== 1 ? 's' : ''} currently shown
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative sm:w-[270px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient or report ID..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[145px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Ready">Ready</option>
                  <option value="Processing">Processing</option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={fetchReports}
                disabled={loading}
                title="Refresh reports"
                aria-label="Refresh reports"
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
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Report
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Test Conducted
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Generated
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
                        Loading medical reports...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <FileText size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No reports found
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try changing the search or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const patientName =
                    `${report.user?.firstName || ''} ${
                      report.user?.lastName || ''
                    }`.trim() || 'Unknown Patient';

                  const testName =
                    report.testCatalog?.testName || 'Unknown Test';

                  const generated = formatDate(report.updatedAt);

                  const isReady = report.status === 'Report_Generated';

                  return (
                    <tr
                      key={report._id}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Report */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                              isReady
                                ? 'border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400'
                                : 'border-violet-400/15 bg-violet-400/[0.07] text-violet-400'
                            }`}
                          >
                            <FileText size={16} />

                            {isReady && (
                              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                              {report._id}
                            </p>

                            <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-600">
                              <Activity size={9} />
                              Diagnostic Report
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08] text-[9px] font-bold text-blue-400">
                            {getPatientInitials(
                              report.user?.firstName,
                              report.user?.lastName
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {patientName}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                              Patient record
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Test */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-400/[0.07] text-slate-500 dark:text-slate-500">
                            <Activity size={13} />
                          </div>

                          <span className="max-w-[220px] truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                            {testName}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={13}
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {generated.date}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                              {generated.time}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 size={11} />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/15 bg-violet-400/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                            Processing
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            title="View report"
                            aria-label={`View report ${report._id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.07] hover:text-cyan-400 dark:text-slate-600 dark:hover:text-cyan-400"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            title="Download PDF"
                            aria-label={`Download report ${report._id}`}
                            disabled={!isReady}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-blue-400/15 hover:bg-blue-400/[0.07] hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-600 dark:hover:text-blue-400"
                          >
                            <Download size={15} />
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
        {!loading && filteredReports.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredReports.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {reports.length}
              </span>{' '}
              reports
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Reporting system synchronized
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Reports;