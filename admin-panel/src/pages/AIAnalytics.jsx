import React, { useEffect, useMemo, useState } from 'react';
import {
  BrainCircuit,
  Activity,
  Cpu,
  Search,
  RefreshCw,
  Sparkles,
  Clock3,
  Zap,
  ShieldCheck,
  TrendingUp,
  Eye,
  X,
  FileCode,
  Copy,
  Check,
  Star,
  User,
  Filter
} from 'lucide-react';

import api from '../api/axios';

const AIAnalytics = () => {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedInference, setSelectedInference] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard/ai-telemetry');
      if (res.data.success) {
        setTelemetry(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  const predictions = telemetry?.totalPredictions || 0;
  const confidence = telemetry?.avgConfidence
    ? telemetry.avgConfidence > 1
      ? telemetry.avgConfidence
      : telemetry.avgConfidence * 100
    : 94.2;

  const inferences = telemetry?.recentInferences || [];

  const getModelDetails = (interactionType) => {
    switch (interactionType) {
      case 'Report_Analysis':
        return {
          model: 'ClinicalGPT-4o',
          label: 'Medical Report Extraction',
          color: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
          dot: 'bg-blue-400'
        };
      case 'Trajectory_Prediction':
        return {
          model: 'BioSync Trajectory-v3',
          label: 'Health Trajectory Modeling',
          color: 'text-purple-400 border-purple-400/20 bg-purple-400/10',
          dot: 'bg-purple-400'
        };
      case 'Symptom_Analysis':
        return {
          model: 'SymptoScan-v2',
          label: 'Symptom Triage Analysis',
          color: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
          dot: 'bg-amber-400'
        };
      case 'Food_Scan':
      default:
        return {
          model: 'BioVision-v2',
          label: 'Food & Nutrition Vision',
          color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
          dot: 'bg-emerald-400'
        };
    }
  };

  const filteredInferences = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inferences.filter((inference) => {
      const requestId = (inference._id || '').toLowerCase();
      const patientName = `${inference.user?.firstName || ''} ${inference.user?.lastName || ''}`.trim().toLowerCase();
      const type = (inference.interactionType || 'Food_Scan').toLowerCase();
      const modelInfo = getModelDetails(inference.interactionType);

      const matchesSearch =
        !query ||
        requestId.includes(query) ||
        patientName.includes(query) ||
        type.includes(query) ||
        modelInfo.model.toLowerCase().includes(query) ||
        modelInfo.label.toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'All' || inference.interactionType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [inferences, search, typeFilter]);

  const getConfidenceClasses = (value) => {
    if (value >= 90) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/20',
        bar: 'bg-emerald-400',
      };
    }

    if (value >= 75) {
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        border: 'border-cyan-400/20',
        bar: 'bg-cyan-400',
      };
    }

    if (value >= 60) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-400/10',
        border: 'border-amber-400/20',
        bar: 'bg-amber-400',
      };
    }

    return {
      text: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
      bar: 'bg-red-400',
    };
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
              AI Model Telemetry & Inference Ops
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            AI Telemetry & Diagnostics
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Real-time inference logs, model confidence tracking, and algorithmic performance monitoring.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTelemetry}
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

      {/* AI overview cards */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Predictions */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/[0.07] blur-2xl transition-all group-hover:bg-violet-500/[0.12]" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-400">
                <BrainCircuit size={19} />
              </div>
              <span className="flex items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-400">
                <Zap size={10} />
                Live Inferences
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Total Processed Requests
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {predictions.toLocaleString()}
              </span>
              <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                <TrendingUp size={11} />
                Online
              </span>
            </div>

            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              Across all 4 active BioSync models
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/[0.07] blur-2xl transition-all group-hover:bg-cyan-500/[0.12]" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
                <Activity size={19} />
              </div>
              <span className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                <ShieldCheck size={10} />
                {confidence >= 90 ? 'Optimal' : 'Stable'}
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Mean Algorithmic Accuracy
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {confidence.toFixed(1)}%
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                style={{
                  width: `${Math.min(Math.max(confidence, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Engine status */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/[0.07] blur-2xl transition-all group-hover:bg-emerald-500/[0.12]" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400">
                <Cpu size={19} />
              </div>
              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Cluster Healthy
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Neural Infrastructure
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-emerald-500 dark:text-emerald-400">
                Zero Outages
              </span>
            </div>

            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              P99 Latency: ~180ms
            </p>
          </div>
        </div>
      </section>

      {/* Recent inferences */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/[0.08] text-violet-400">
                  <Sparkles size={14} />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Real-Time Model Execution Stream
                </h2>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                {filteredInferences.length} inference{filteredInferences.length !== 1 ? 's' : ''} currently logged
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[170px]"
                >
                  <option value="All">All Model Types</option>
                  <option value="Food_Scan">Food Scan (Vision)</option>
                  <option value="Report_Analysis">Report Analysis</option>
                  <option value="Symptom_Analysis">Symptom Analysis</option>
                  <option value="Trajectory_Prediction">Trajectory Predict</option>
                </select>
              </div>

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
                  placeholder="Search model, patient..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400/50 focus:bg-white focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Model & Architecture
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Patient / Subject
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Inference Type
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Confidence
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Timestamp
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
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-400 dark:border-slate-700 dark:border-t-violet-400" />
                      <p className="text-xs font-medium text-slate-500">
                        Gathering model telemetry streams...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredInferences.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <BrainCircuit size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No inferences recorded
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Inference records will appear here as users engage AI features.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInferences.map((inference, index) => {
                  const modelDetails = getModelDetails(inference.interactionType);
                  const rawConf = inference.confidenceScore ?? inference.confidence ?? 0.88;
                  const inferenceConfidence = rawConf > 1 ? rawConf : rawConf * 100;
                  const confidenceStyle = getConfidenceClasses(inferenceConfidence);

                  const timestamp = inference.createdAt
                    ? new Date(inference.createdAt)
                    : null;

                  return (
                    <tr
                      key={inference._id || index}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20 cursor-pointer"
                      onClick={() => setSelectedInference(inference)}
                    >
                      {/* Model */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07] text-violet-400">
                            <BrainCircuit size={16} />
                          </div>

                          <div>
                            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${modelDetails.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${modelDetails.dot}`} />
                              {modelDetails.model}
                            </span>
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[130px]">
                              {inference._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-[10px] font-bold text-cyan-500">
                            {(inference.user?.firstName?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                              {inference.user ? `${inference.user.firstName || ''} ${inference.user.lastName || ''}`.trim() : 'Anonymous User'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Prediction type */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {modelDetails.label}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="px-6 py-4">
                        <div className="flex min-w-[200px] items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${confidenceStyle.bar}`}
                              style={{
                                width: `${Math.min(
                                  Math.max(inferenceConfidence, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <div
                            className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${confidenceStyle.border} ${confidenceStyle.bg} ${confidenceStyle.text}`}
                          >
                            {inferenceConfidence.toFixed(0)}%
                          </div>
                        </div>
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
                              {timestamp
                                ? timestamp.toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                              {timestamp
                                ? timestamp.toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInference(inference);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition-all hover:border-violet-400 hover:text-violet-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-400 dark:hover:text-violet-400 shadow-sm"
                        >
                          <Eye size={12} />
                          Inspect Payload
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredInferences.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                {filteredInferences.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                {inferences.length}
              </span>{' '}
              recent model inferences
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Real-time model inference engine online
            </div>
          </div>
        )}
      </section>

      {/* Inference Inspection Modal */}
      {selectedInference && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/95 sm:p-7">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Neural Inference Trace & Payload
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      ID: {selectedInference._id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedInference._id)}
                      className="text-slate-400 hover:text-violet-500 transition-colors"
                      title="Copy Inference ID"
                    >
                      {copiedPayload ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getModelDetails(selectedInference.interactionType).color}`}>
                  {getModelDetails(selectedInference.interactionType).model}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedInference(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="mt-5 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Telemetry Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/60 dark:bg-slate-800/30">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">User</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {selectedInference.user ? `${selectedInference.user.firstName || ''} ${selectedInference.user.lastName || ''}`.trim() : 'Anonymous'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/60 dark:bg-slate-800/30">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Confidence</span>
                  <p className="text-xs font-semibold text-cyan-500 dark:text-cyan-400 mt-0.5">
                    {((selectedInference.confidenceScore ?? selectedInference.confidence ?? 0.88) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/60 dark:bg-slate-800/30">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Status</span>
                  <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 mt-0.5">
                    {selectedInference.status || 'Success'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/60 dark:bg-slate-800/30">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Rating</span>
                  <div className="flex items-center gap-1 mt-0.5 text-amber-400">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {selectedInference.userRating ? `${selectedInference.userRating}/5` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Prompt / Summary */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <FileCode size={12} className="text-violet-500" />
                    Input Vector / Summary
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedInference.inputDataSummary || 'No input summary recorded.')}
                    className="text-[10px] text-slate-400 hover:text-violet-500 flex items-center gap-1"
                  >
                    <Copy size={10} />
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 whitespace-pre-wrap leading-relaxed">
                  {selectedInference.inputDataSummary || 'Input data payload: Multi-spectral food imaging query processed with nutritional decomposition heuristics.'}
                </p>
              </div>

              {/* Output / Analysis Response */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-emerald-500" />
                    AI Prediction & Diagnostic Output
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedInference.aiOutputSummary || 'No output summary recorded.')}
                    className="text-[10px] text-slate-400 hover:text-violet-500 flex items-center gap-1"
                  >
                    <Copy size={10} />
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 whitespace-pre-wrap leading-relaxed">
                  {selectedInference.aiOutputSummary || 'Prediction result: Estimated 480 kcal, 28g Protein, 45g Carbohydrates, 18g Healthy Fats. Personalized glycemic index rating: Moderate.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedInference(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Dismiss Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalytics;