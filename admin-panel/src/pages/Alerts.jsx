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
  CheckCircle2,
  Phone,
  Mail,
  User,
  Stethoscope,
  X,
  FileHeart,
  ExternalLink,
  Check
} from 'lucide-react';

import api from '../api/axios';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

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

  const handleUpdateStatus = async (alertItem, newStatus) => {
    try {
      setActionLoading(true);
      const vitalsId = alertItem.vitalsId || alertItem._id;
      const res = await api.put(`/admin/dashboard/alerts/${vitalsId}`, {
        alertId: alertItem.alertDetailId,
        status: newStatus
      });

      if (res.data.success) {
        setNotificationMsg(`Alert successfully marked as ${newStatus.replace('_', ' ')}`);
        setTimeout(() => setNotificationMsg(''), 3000);
        setSelectedAlert(null);
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error updating alert status:', error);
      alert(error.response?.data?.message || 'Failed to update alert status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const severity = alert.severity || 'Medium';
      const type = alert.type || alert.biomarker || 'Vital Metric Anomaly';
      const description = alert.description || alert.message || '';
      const patient = (alert.patientName || alert.user?.firstName || '').toLowerCase();
      const status = alert.status || 'Unresolved';

      const matchesSeverity =
        severityFilter === 'All' || severity.toLowerCase() === severityFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();

      const matchesSearch =
        !query ||
        severity.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        patient.includes(query);

      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [alerts, severityFilter, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter((a) => (a.severity || '').toLowerCase() === 'critical' || (a.severity || '').toLowerCase() === 'high').length,
      unresolved: alerts.filter((a) => (a.status || 'Unresolved').toLowerCase() === 'unresolved').length,
      resolved: alerts.filter((a) => (a.status || '').toLowerCase() === 'resolved').length,
    };
  }, [alerts]);

  const getSeverityConfig = (severity) => {
    const s = (severity || 'Medium').toLowerCase();
    switch (s) {
      case 'critical':
      case 'high':
        return {
          icon: ShieldAlert,
          text: 'text-red-500 dark:text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          iconBg: 'bg-red-500/10',
          dot: 'bg-red-500',
          label: severity || 'Critical'
        };

      case 'low':
        return {
          icon: AlertCircle,
          text: 'text-blue-500 dark:text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          iconBg: 'bg-blue-500/10',
          dot: 'bg-blue-500',
          label: 'Low'
        };

      case 'medium':
      default:
        return {
          icon: AlertTriangle,
          text: 'text-amber-500 dark:text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          iconBg: 'bg-amber-500/10',
          dot: 'bg-amber-500',
          label: 'Medium'
        };
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Unresolved').toLowerCase();
    switch (s) {
      case 'resolved':
        return {
          classes: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
          icon: CheckCircle2,
          label: 'Resolved'
        };
      case 'doctor_notified':
        return {
          classes: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400',
          icon: Stethoscope,
          label: 'Doctor Notified'
        };
      case 'unresolved':
      default:
        return {
          classes: 'border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400',
          icon: AlertTriangle,
          label: 'Action Required'
        };
    }
  };

  const formatDate = (date) => {
    if (!date) return { date: '—', time: '' };
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return { date: '—', time: '' };

    return {
      date: parsedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: parsedDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} />
          {notificationMsg}
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 dark:text-red-400">
              Clinical Telemetry & Escalations
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Critical Biomarker Alerts
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Real-time biometric monitoring flagging out-of-range patient laboratory results and vitals.
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
          Refresh Telemetry
        </button>
      </div>

      {/* Alert overview */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-500/[0.07] blur-2xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-400/15 bg-slate-400/[0.08] text-slate-500 dark:text-slate-400">
              <Activity size={19} />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Total Triggered
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              {stats.total}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
              Cumulative critical episodes
            </p>
          </div>
        </div>

        {/* Critical */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/[0.07] blur-2xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400">
              <ShieldAlert size={19} />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              High / Critical Severity
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-red-500 dark:text-red-400">
              {stats.critical}
            </p>
            <p className="mt-1 text-[10px] text-red-500 dark:text-red-400 font-medium">
              Requires immediate triage
            </p>
          </div>
        </div>

        {/* Unresolved */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/[0.07] blur-2xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <AlertTriangle size={19} />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Pending Resolution
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-amber-500 dark:text-amber-400">
              {stats.unresolved}
            </p>
            <p className="mt-1 text-[10px] text-amber-500 dark:text-amber-400 font-medium">
              Open clinical flags
            </p>
          </div>
        </div>

        {/* Resolved */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/[0.07] blur-2xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 size={19} />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Resolved & Cleared
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-emerald-500 dark:text-emerald-400">
              {stats.resolved}
            </p>
            <p className="mt-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">
              Doctor action logged
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
                Biomarker Incidents Ledger
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} currently displayed
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative sm:w-[260px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search biomarker, patient..."
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
                  <option value="Critical">Critical / High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-red-400/50 focus:ring-4 focus:ring-red-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[150px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Unresolved">Unresolved</option>
                  <option value="Doctor_Notified">Doctor Notified</option>
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
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Severity & Biomarker
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Patient Contact
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Recorded Anomaly
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Timestamp
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Resolution Status
                </th>
                <th className="px-6 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-red-400 dark:border-slate-700 dark:border-t-red-400" />
                      <p className="text-xs font-medium text-slate-500">
                        Analyzing vital telemetry streams...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                        <Activity size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No critical alerts found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        All patient vitals and laboratory results are operating within nominal thresholds.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, index) => {
                  const severity = alert.severity || 'High';
                  const config = getSeverityConfig(severity);
                  const SeverityIcon = config.icon;
                  const statusBadge = getStatusBadge(alert.status);
                  const StatusIcon = statusBadge.icon;
                  const timestamp = formatDate(alert.recordedAt || alert.createdAt);

                  return (
                    <tr
                      key={alert._id || index}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20 cursor-pointer"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      {/* Severity & Biomarker */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.border} ${config.iconBg} ${config.text}`}
                          >
                            <SeverityIcon size={16} />
                          </div>

                          <div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.border} ${config.bg} ${config.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                              {severity}
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                              {alert.biomarker || alert.type || 'Biomarker Anomaly'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {alert.patientName || `${alert.user?.firstName || ''} ${alert.user?.lastName || ''}`.trim() || 'Anonymous Patient'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              {alert.patientPhone || alert.user?.phoneNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description / Anomaly */}
                      <td className="max-w-[380px] px-6 py-4">
                        <p className="line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                          {alert.description || alert.message || 'Critical threshold breached. Clinical action required.'}
                        </p>
                        {alert.recordedValue !== undefined && (
                          <span className="inline-block mt-1 font-mono text-[10px] font-semibold text-red-500 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                            Value: {alert.recordedValue}
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={13}
                            className="shrink-0 text-slate-400 dark:text-slate-500"
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {timestamp.date}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                              {timestamp.time}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusBadge.classes}`}>
                          <StatusIcon size={11} />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition-all hover:border-red-400 hover:text-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-400 dark:hover:text-red-400 shadow-sm"
                        >
                          Review & Triage
                        </button>
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
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Displaying{' '}
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                {filteredAlerts.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                {alerts.length}
              </span>{' '}
              clinical events
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              Real-time physiological guardian active
            </div>
          </div>
        )}
      </section>

      {/* Alert Clinical Triage Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/95 sm:p-7">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:text-red-400">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Clinical Telemetry Triage
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Biomarker: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAlert.biomarker || selectedAlert.type}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-4">
              {/* Patient Profile Card */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-800/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Patient Contact Info
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Patient Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAlert.patientName || `${selectedAlert.user?.firstName || ''} ${selectedAlert.user?.lastName || ''}`.trim() || 'Anonymous Patient'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {selectedAlert.patientPhone || selectedAlert.user?.phoneNumber || 'Not provided'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Source Assessment</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {selectedAlert.source || 'Lab Assistant Physical Assessment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Anomaly Details */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  Biometric Anomaly Diagnostic
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedAlert.description || 'Threshold breached.'}
                </p>
                {selectedAlert.recordedValue !== undefined && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Captured Value:</span>
                    <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-500/20">
                      {selectedAlert.recordedValue}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Dismiss
              </button>

              <button
                type="button"
                disabled={actionLoading || selectedAlert.status === 'Doctor_Notified'}
                onClick={() => handleUpdateStatus(selectedAlert, 'Doctor_Notified')}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 transition-all hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <Stethoscope size={13} />
                Notify Specialist Doctor
              </button>

              <button
                type="button"
                disabled={actionLoading || selectedAlert.status === 'Resolved'}
                onClick={() => handleUpdateStatus(selectedAlert, 'Resolved')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-400 disabled:opacity-50"
              >
                <Check size={13} />
                Mark Resolved & Cleared
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;