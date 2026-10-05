import React, { useEffect, useMemo, useState } from 'react';
import {
  Navigation,
  Search,
  TestTube2,
  UserRoundCog,
  Clock3,
  RefreshCw,
  Activity,
  X,
  CheckCircle2,
  Save,
  QrCode,
} from 'lucide-react';

import api from '../api/axios';

const Samples = () => {
  const [samples, setSamples] = useState([]);
  const [labAssistants, setLabAssistants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Selected sample modal state
  const [selectedSample, setSelectedSample] = useState(null);
  const [assignAssistantId, setAssignAssistantId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');

  useEffect(() => {
    fetchSamples();
    fetchAssistants();
  }, []);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard/sample-pipeline');
      if (res.data.success) {
        setSamples(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistants = async () => {
    try {
      const res = await api.get('/admin/lab-assistants');
      if (res.data.success) {
        setLabAssistants(res.data.labAssistants || []);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
    }
  };

  const openSampleModal = (sample) => {
    setSelectedSample(sample);
    setAssignAssistantId(sample.labAssistant?._id || sample.labAssistant || '');
    setAssignSuccess('');
  };

  const handleAssignAssistant = async (e) => {
    e.preventDefault();
    if (!selectedSample || !assignAssistantId) return;

    try {
      setAssigning(true);
      setAssignSuccess('');
      const res = await api.put(`/admin/samples/${selectedSample._id}/assign`, {
        labAssistantId: assignAssistantId,
      });

      if (res.data.success) {
        const updated = res.data.sample;
        const assignedLa = labAssistants.find((la) => la._id === assignAssistantId);
        const completeUpdated = {
          ...selectedSample,
          status: 'Assigned',
          labAssistant: assignedLa || { name: 'Assigned Assistant' },
        };

        setSelectedSample(completeUpdated);
        setSamples((prev) =>
          prev.map((s) => (s._id === selectedSample._id ? completeUpdated : s))
        );
        setAssignSuccess('Lab Assistant successfully assigned to sample & appointment');
        setTimeout(() => setAssignSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error assigning assistant:', err);
      alert(err.response?.data?.message || 'Failed to assign lab assistant');
    } finally {
      setAssigning(false);
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
      const barcode = sample.barcode || '';
      const id = sample._id || '';

      const matchesSearch =
        !query ||
        patientName.toLowerCase().includes(query) ||
        testName.toLowerCase().includes(query) ||
        assistantName.toLowerCase().includes(query) ||
        barcode.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'All' || sample.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [samples, search, statusFilter]);

  const statusStats = useMemo(() => {
    return {
      total: samples.length,
      requested: samples.filter((s) => s.status === 'Requested').length,
      assigned: samples.filter((s) => s.status === 'Assigned').length,
      collected: samples.filter((s) => s.status === 'Sample_Collected').length,
      processing: samples.filter(
        (s) => s.status === 'Processing' || s.status === 'At_Laboratory'
      ).length,
      completed: samples.filter((s) => s.status === 'Report_Generated' || s.status === 'Delivered').length,
    };
  }, [samples]);

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Requested':
        return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
      case 'Assigned':
        return 'border-amber-400/15 bg-amber-400/[0.08] text-amber-400';
      case 'Sample_Collected':
      case 'At_Laboratory':
        return 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400';
      case 'Processing':
        return 'border-violet-400/15 bg-violet-400/[0.08] text-violet-400';
      case 'Report_Generated':
      case 'Delivered':
        return 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400';
      default:
        return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
    }
  };

  const formatStatus = (status) => {
    return (status || 'Requested').replace(/_/g, ' ');
  };

  const formatDate = (date) => {
    if (!date) return { date: '—', time: '' };
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return { date: '—', time: '' };
    return {
      date: parsed.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: parsed.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Diagnostic Logistics
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Sample Tracking & Pipeline
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Monitor chain of custody, biological specimen barcodes, and laboratory turnaround times.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              fetchSamples();
              fetchAssistants();
            }}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={14}
              className={`text-slate-500 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Pipeline
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
              Total In Pipeline
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <TestTube2 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {statusStats.total}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            All registered specimens
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">
              Awaiting Collection
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/[0.08] text-amber-400">
              <Clock3 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-500 sm:text-3xl">
            {statusStats.requested + statusStats.assigned}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Pending field phlebotomist visit
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">
              Lab Processing
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-400/[0.08] text-violet-400">
              <Activity size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-violet-500 sm:text-3xl">
            {statusStats.processing}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Under clinical assay evaluation
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
              Reports Ready
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
            {statusStats.completed}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Certified by pathologist
          </p>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Requested', 'Assigned', 'Sample_Collected', 'Processing', 'Report_Generated'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Samples' : formatStatus(tab)}
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
              placeholder="Search barcode, patient, assistant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Barcode & Specimen
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Diagnostic Test
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Field Assistant
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Pipeline Status
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
                      <p className="text-xs font-medium text-slate-500">Tracking specimens...</p>
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
                        Try modifying search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => {
                  const patientName = `${sample.user?.firstName || ''} ${
                    sample.user?.lastName || ''
                  }`.trim() || 'Patient';
                  const assistantName = sample.labAssistant?.name || 'Unassigned';
                  const updated = formatDate(sample.updatedAt || sample.createdAt);

                  return (
                    <tr
                      key={sample._id}
                      onClick={() => openSampleModal(sample)}
                      className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Barcode */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/[0.08] text-cyan-500">
                            <QrCode size={15} />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {sample.barcode || `SMP-${sample._id?.substring(0, 6)}`}
                            </span>
                            <p className="font-mono text-[10px] text-slate-400">
                              #{sample._id?.substring(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {patientName}
                        </p>
                      </td>

                      {/* Test */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {sample.testCatalog?.testName || 'Diagnostic Panel'}
                        </p>
                      </td>

                      {/* Assistant */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                              sample.labAssistant
                                ? 'bg-emerald-400/[0.08] text-emerald-500'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                            }`}
                          >
                            <UserRoundCog size={13} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {assistantName}
                            </p>
                            {!sample.labAssistant && (
                              <p className="text-[9px] font-semibold text-amber-500">
                                Click to assign
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
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {formatStatus(sample.status)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {updated.date}
                        </p>
                        <p className="text-[10px] text-slate-400">{updated.time}</p>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSampleModal(sample);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-cyan-400/20 hover:text-cyan-500 dark:border-slate-800 dark:bg-slate-950"
                        >
                          <Navigation size={14} />
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
        {!loading && filteredSamples.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredSamples.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{samples.length}</span> samples
            </p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Specimen tracking synchronized
            </div>
          </div>
        )}
      </section>

      {/* Sample Detail & Lab Assistant Assignment Modal */}
      {selectedSample && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedSample(null)} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <TestTube2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Specimen Tracking & Custody
                  </h2>
                  <p className="font-mono text-xs text-slate-500">
                    Barcode: {selectedSample.barcode || `SMP-${selectedSample._id?.substring(0, 6)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSample(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {assignSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  {assignSuccess}
                </div>
              )}

              {/* Patient & Test Overview */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSample.user?.firstName} {selectedSample.user?.lastName || ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    Specimen: {selectedSample.testCatalog?.sampleType || 'Blood'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnostic Panel</span>
                  <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                    {selectedSample.testCatalog?.testName || 'Diagnostic Test'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Turnaround: {selectedSample.turnaroundTimeHours || '12'} hours
                  </p>
                </div>
              </div>

              {/* Lab Assistant Dispatch Form */}
              <form onSubmit={handleAssignAssistant} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/30">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Phlebotomist & Courier Allocation
                </h3>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Select Available Field Assistant
                    </label>
                    <select
                      value={assignAssistantId}
                      onChange={(e) => setAssignAssistantId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="">-- Choose Assistant --</option>
                      {labAssistants.map((la) => (
                        <option key={la._id} value={la._id}>
                          {la.name} ({la.status}) {la.vehicleType ? `- ${la.vehicleType}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={assigning || !assignAssistantId}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-50"
                  >
                    <Save size={13} className={assigning ? 'animate-spin' : ''} />
                    <span>{assigning ? 'Assigning...' : 'Assign Staff'}</span>
                  </button>
                </div>
              </form>

              {/* Custody Dates */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Collection Date</span>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {selectedSample.collectionTime ? new Date(selectedSample.collectionTime).toLocaleDateString() : 'Pending'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Lab Ingestion</span>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {selectedSample.labProcessingStartTime ? new Date(selectedSample.labProcessingStartTime).toLocaleDateString() : 'Awaiting receipt'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Current Phase</span>
                  <p className="mt-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {formatStatus(selectedSample.status)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-200/80 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setSelectedSample(null)}
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

export default Samples;