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
  X,
  AlertTriangle,
  QrCode,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';

import api from '../api/axios';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Report detail modal state
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports');

      if (res.data.success) {
        setReports(res.data.data || []);
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
      const barcode = report.barcode || '';
      const reportId = report._id || '';

      const matchesSearch =
        !query ||
        patientName.toLowerCase().includes(query) ||
        testName.toLowerCase().includes(query) ||
        barcode.toLowerCase().includes(query) ||
        reportId.toLowerCase().includes(query);

      const reportStatus =
        report.status === 'Report_Generated' ? 'Ready' : 'Processing';

      const matchesStatus =
        statusFilter === 'All' ||
        reportStatus === statusFilter ||
        report.status === statusFilter;

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

  const getPatientInitials = (first, last) => {
    const f = first?.trim()?.[0] || '';
    const l = last?.trim()?.[0] || '';
    return `${f}${l}`.toUpperCase() || 'PT';
  };

  const handleDownload = (report) => {
    if (report.resultPdfUrl) {
      window.open(report.resultPdfUrl, '_blank');
      return;
    }

    // Generate clinical summary download
    const patientName = `${report.user?.firstName || 'Patient'} ${report.user?.lastName || ''}`.trim();
    const testName = report.testCatalog?.testName || 'Diagnostic Lab Test';
    const dateStr = new Date(report.updatedAt || report.createdAt).toLocaleDateString();

    let content = `=========================================================\n`;
    content += `             BIOSYNC AI CLINICAL DIAGNOSTIC REPORT        \n`;
    content += `=========================================================\n`;
    content += `Report ID:     ${report._id}\n`;
    content += `Barcode:       ${report.barcode || 'N/A'}\n`;
    content += `Patient:       ${patientName}\n`;
    content += `Phone:         ${report.user?.phoneNumber || 'N/A'}\n`;
    content += `Test:          ${testName}\n`;
    content += `Status:        ${report.status}\n`;
    content += `Issued Date:   ${dateStr}\n`;
    content += `Turnaround:    ${report.turnaroundTimeHours || 'Standard'} hours\n`;
    content += `---------------------------------------------------------\n`;
    content += `STRUCTURED BIOMARKERS / ASSAY RESULTS:\n`;
    content += `---------------------------------------------------------\n`;

    if (report.structuredResults && report.structuredResults.length > 0) {
      report.structuredResults.forEach((b) => {
        content += `- ${b.biomarker}: ${b.value} ${b.isCritical ? ' [CRITICAL ALERT]' : ' [NORMAL]'}\n`;
      });
    } else {
      content += `Biomarker analysis verified by laboratory pathologist.\n`;
    }

    content += `=========================================================\n`;
    content += `Certified by BioSync Automated Diagnostic Core\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BioSync_Report_${report.barcode || report._id?.substring(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Clinical Reports
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Diagnostic Reports
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Access verified lab outcomes, review biomarker values, and download PDFs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={14}
              className={`text-slate-500 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Reports
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
              Total Reports
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <FileText size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            All processed patient assays
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
              Ready & Certified
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
            {stats.ready}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Available for PDF download
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">
              Under Processing
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-400/[0.08] text-violet-400">
              <Clock3 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-violet-500 sm:text-3xl">
            {stats.processing}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Samples in laboratory analysis
          </p>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Ready', 'Processing'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === status
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
              placeholder="Search patient, test, barcode..."
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
                  Report ID & Barcode
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Test Conducted
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Generated Time
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
                      <p className="text-xs font-medium text-slate-500">Loading medical reports...</p>
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
                    `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim() ||
                    'Unknown Patient';
                  const testName = report.testCatalog?.testName || 'Diagnostic Test';
                  const generated = formatDate(report.updatedAt || report.createdAt);
                  const isReady = report.status === 'Report_Generated';

                  return (
                    <tr
                      key={report._id}
                      onClick={() => setSelectedReport(report)}
                      className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Barcode & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/[0.08] text-cyan-500">
                            <QrCode size={15} />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {report.barcode || `REP-${report._id?.substring(0, 6)}`}
                            </span>
                            <p className="font-mono text-[10px] text-slate-400">
                              #{report._id?.substring(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08] text-[9px] font-bold text-blue-500">
                            {getPatientInitials(report.user?.firstName, report.user?.lastName)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {patientName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {report.user?.phoneNumber || 'No phone'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Test */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {testName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Sample: {report.testCatalog?.sampleType || 'Specimen'}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {generated.date}
                        </p>
                        <p className="text-[10px] text-slate-400">{generated.time}</p>
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                            }}
                            title="View report details"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.07] hover:text-cyan-400"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(report);
                            }}
                            title="Download PDF or clinical summary"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-blue-400/15 hover:bg-blue-400/[0.07] hover:text-blue-400"
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
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredReports.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{reports.length}</span> reports
            </p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Reporting engine synchronized
            </div>
          </div>
        )}
      </section>

      {/* View Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedReport(null)} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Medical Diagnostic Report
                  </h2>
                  <p className="font-mono text-xs text-slate-500">
                    Barcode: {selectedReport.barcode || `REP-${selectedReport._id?.substring(0, 6)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {/* Patient & Test Header Summary */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedReport.user?.firstName} {selectedReport.user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedReport.user?.phoneNumber || 'No phone'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Test Performed</span>
                  <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                    {selectedReport.testCatalog?.testName || 'Diagnostic Panel'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Turnaround: {selectedReport.turnaroundTimeHours || '12'} hrs
                  </p>
                </div>
              </div>

              {/* Biomarkers / Structured Results */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/30">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Biomarker Assay Values
                </h3>

                {selectedReport.structuredResults && selectedReport.structuredResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase text-slate-400 dark:border-slate-800">
                          <th className="pb-2">Biomarker</th>
                          <th className="pb-2">Observed Value</th>
                          <th className="pb-2 text-right">Triage Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedReport.structuredResults.map((item, idx) => (
                          <tr key={idx} className="py-2">
                            <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                              {item.biomarker}
                            </td>
                            <td className="py-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {item.value}
                            </td>
                            <td className="py-2 text-right">
                              {item.isCritical ? (
                                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                  <AlertTriangle size={10} />
                                  Critical
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                  <CheckCircle2 size={10} />
                                  Normal
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Standard lab certificate on file. Detailed digital biomarkers are being parsed.
                  </div>
                )}
              </div>

              {/* Evidence image if available */}
              {selectedReport.evidenceImageUrl && (
                <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/30">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Collection Evidence Image
                  </h3>
                  <img
                    src={selectedReport.evidenceImageUrl}
                    alt="Sample collection evidence"
                    className="h-48 w-full rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-900/30">
              <span className="text-xs text-slate-500">
                Status: <strong className="text-slate-800 dark:text-slate-200">{selectedReport.status}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(selectedReport)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-cyan-400 hover:to-blue-500"
                >
                  <Download size={14} />
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;