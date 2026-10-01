import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Download,
  Search,
  Filter,
  RefreshCw,
  Cpu,
  FileText,
  Database,
  Radio,
  Clock,
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../api/axios';

export default function ErrorMonitoring() {
  const [data, setData] = useState({
    metrics: {
      totalIncidents: 4,
      activeIncidents: 2,
      criticalCount: 1,
      aiErrorRate: '0.8%',
      pdfExtractionFailures: 1,
      systemHealthScore: '99.2%',
      avgRecoveryTime: '4.2m',
    },
    incidents: [],
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal inspection state
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [copied, setCopied] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (serviceFilter !== 'All') params.module = serviceFilter;
      if (severityFilter !== 'All') params.severity = severityFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/admin/error-monitoring', { params });
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load error monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [serviceFilter, severityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleRetryJob = async (incident) => {
    try {
      setRetryingId(incident._id);
      const res = await api.post(`/admin/error-monitoring/${incident._id}/retry`);
      if (res.data.success) {
        setActionSuccessMsg(`Job #${incident._id} re-enqueued successfully!`);
        setData((prev) => ({
          ...prev,
          incidents: prev.incidents.map((inc) =>
            inc._id === incident._id
              ? { ...inc, status: 'Retried', retryCount: (inc.retryCount || 0) + 1 }
              : inc
          ),
        }));
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetryingId(null);
    }
  };

  const handleAcknowledge = async (incident, newStatus = 'Acknowledged') => {
    try {
      const res = await api.put(`/admin/error-monitoring/${incident._id}/acknowledge`, {
        status: newStatus,
      });
      if (res.data.success) {
        setActionSuccessMsg(`Incident #${incident._id} marked as ${newStatus}`);
        setData((prev) => ({
          ...prev,
          incidents: prev.incidents.map((inc) =>
            inc._id === incident._id ? { ...inc, status: newStatus } : inc
          ),
        }));
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Acknowledge failed:', err);
    }
  };

  const handleExportTelemetry = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `biosync-error-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity) => {
    const s = (severity || '').toLowerCase();
    if (s === 'critical') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <ShieldAlert size={12} />
          CRITICAL
        </span>
      );
    }
    if (s === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <AlertTriangle size={12} />
          ERROR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
        <Activity size={12} />
        WARNING
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Active
        </span>
      );
    }
    if (s === 'acknowledged') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
          Acknowledged
        </span>
      );
    }
    if (s === 'retried') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-600 border border-cyan-500/30">
          <RotateCcw size={10} />
          Retried
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
        <CheckCircle2 size={10} />
        Resolved
      </span>
    );
  };

  const getServiceIcon = (service) => {
    const s = (service || '').toLowerCase();
    if (s.includes('ai')) return <Cpu size={16} className="text-cyan-500" />;
    if (s.includes('ocr') || s.includes('pdf')) return <FileText size={16} className="text-purple-500" />;
    if (s.includes('database') || s.includes('auth')) return <Database size={16} className="text-amber-500" />;
    if (s.includes('iot') || s.includes('chain')) return <Radio size={16} className="text-emerald-500" />;
    return <Layers size={16} className="text-slate-400" />;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              System Error & Incident Monitoring
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-md">
              SRE Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of AI engine timeouts, OCR parsing anomalies, database spikes & automated recovery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleExportTelemetry}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:opacity-95 shadow-md shadow-cyan-500/20 transition"
          >
            <Download size={14} />
            Export Telemetry
          </button>
        </div>
      </div>

      {/* ── Success Toast Alert ── */}
      {actionSuccessMsg && (
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Incidents</span>
            <Layers size={14} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {data.metrics?.totalIncidents || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Last 24 Hours</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {data.metrics?.activeIncidents || 0}
          </div>
          <div className="text-[11px] text-rose-500 font-semibold mt-1">Requires Attention</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Timeout Rate</span>
            <Cpu size={14} className="text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {data.metrics?.aiErrorRate || '0.8%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">&lt; 1.0% SLA Threshold</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">OCR PDF Fails</span>
            <FileText size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {data.metrics?.pdfExtractionFailures || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Non-conformant scans</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Health Score</span>
            <Activity size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {data.metrics?.systemHealthScore || '99.2%'}
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold mt-1">Operational</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Resolution</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {data.metrics?.avgRecoveryTime || '4.2m'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Auto-recovery MTTR</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by error message, incident ID (INC-xxx), or resource..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Service filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Services</option>
            <option value="AI Engine">AI Engine</option>
            <option value="OCR Extractor">OCR Extractor</option>
            <option value="Database & Auth">Database & Auth</option>
            <option value="Cold Chain IoT">Cold Chain IoT</option>
          </select>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Error">Error</option>
            <option value="Warning">Warning</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Retried">Retried</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* ── Technical Incidents List / Table ── */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-cyan-500" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Technical Incident Queue
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {data.incidents?.length || 0} incidents
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-cyan-500" />
            <p className="text-xs font-semibold">Querying system incident telemetry...</p>
          </div>
        ) : (data.incidents || []).length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No active technical incidents matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">All AI inference and background pipelines operating smoothly.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {(data.incidents || []).map((incident) => {
              const isRetrying = retryingId === incident._id;
              return (
                <div
                  key={incident._id}
                  className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Icon + Core details */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                      {getServiceIcon(incident.service)}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-cyan-600 dark:text-cyan-400">
                          #{incident._id}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-400">
                          [{incident.incidentCode}]
                        </span>
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>

                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {incident.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Service: <strong className="text-slate-700 dark:text-slate-200">{incident.service}</strong>
                        </span>
                        <span>
                          Resource: <strong className="text-slate-700 dark:text-slate-200">{incident.affectedResource}</strong>
                        </span>
                        <span>
                          Time: <strong className="text-slate-700 dark:text-slate-200">{new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
                        </span>
                        {incident.retryCount > 0 && (
                          <span className="text-cyan-600 font-semibold">
                            Retries: {incident.retryCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      Inspect
                    </button>

                    {incident.status === 'Active' && (
                      <button
                        onClick={() => handleAcknowledge(incident, 'Acknowledged')}
                        className="px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition"
                      >
                        Acknowledge
                      </button>
                    )}

                    {(incident.status === 'Active' || incident.status === 'Acknowledged') && (
                      <button
                        onClick={() => handleAcknowledge(incident, 'Resolved')}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition"
                      >
                        Resolve
                      </button>
                    )}

                    <button
                      onClick={() => handleRetryJob(incident)}
                      disabled={isRetrying}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:opacity-95 shadow-sm transition disabled:opacity-50"
                    >
                      <RotateCcw size={12} className={isRetrying ? 'animate-spin' : ''} />
                      {isRetrying ? 'Retrying...' : 'Retry Job'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Incident Detail & Stack Trace Modal ── */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-cyan-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Incident Diagnostic Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black text-cyan-600 dark:text-cyan-400">
                  #{selectedIncident._id}
                </span>
                {getSeverityBadge(selectedIncident.severity)}
                {getStatusBadge(selectedIncident.status)}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Incident Message
                </h4>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedIncident.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-400 font-bold block mb-1">SERVICE / SUBSYSTEM</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIncident.service} ({selectedIncident.module})</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-400 font-bold block mb-1">AFFECTED RESOURCE</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedIncident.affectedResource}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-400 font-bold block mb-1">RECORDED TIMESTAMP</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(selectedIncident.timestamp).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-400 font-bold block mb-1">CLIENT ORIGIN IP</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{selectedIncident.clientIp}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Error Context & Stack Trace
                  </h4>
                  <button
                    onClick={() => copyToClipboard(selectedIncident.errorDetails || selectedIncident.message)}
                    className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:text-cyan-500"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy Trace'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto whitespace-pre-wrap border border-slate-800">
                  {selectedIncident.errorDetails || selectedIncident.message}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRetryJob(selectedIncident);
                  setSelectedIncident(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:opacity-95 shadow-md shadow-cyan-500/20 transition"
              >
                <RotateCcw size={14} />
                Retry Failed Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
