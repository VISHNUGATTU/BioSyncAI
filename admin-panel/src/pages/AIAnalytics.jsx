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
} from 'lucide-react';

import api from '../api/axios';

const AIAnalytics = () => {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    ? telemetry.avgConfidence * 100
    : 0;

  const inferences = telemetry?.recentInferences || [];

  const filteredInferences = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return inferences;
    }

    return inferences.filter((inference) => {
      const requestId = inference._id || '';
      const predictionType = 'Food Scanner Analysis';
      const model = 'BioVision v2';

      return (
        requestId.toLowerCase().includes(query) ||
        predictionType.toLowerCase().includes(query) ||
        model.toLowerCase().includes(query)
      );
    });
  }, [inferences, search]);

  const getConfidenceLabel = (value) => {
    if (value >= 90) return 'High';
    if (value >= 75) return 'Good';
    if (value >= 60) return 'Moderate';
    return 'Low';
  };

  const getConfidenceClasses = (value) => {
    if (value >= 90) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-400/[0.08]',
        border: 'border-emerald-400/15',
        bar: 'bg-emerald-400',
      };
    }

    if (value >= 75) {
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-400/[0.08]',
        border: 'border-cyan-400/15',
        bar: 'bg-cyan-400',
      };
    }

    if (value >= 60) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-400/[0.08]',
        border: 'border-amber-400/15',
        bar: 'bg-amber-400',
      };
    }

    return {
      text: 'text-red-400',
      bg: 'bg-red-400/[0.08]',
      border: 'border-red-400/15',
      bar: 'bg-red-400',
    };
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
              AI Operations
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            AI Telemetry & Analytics
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Monitor the health, accuracy, and activity of BioSync AI engines.
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
          Refresh telemetry
        </button>
      </div>

      {/* AI overview */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Predictions */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/[0.07] blur-2xl transition-all group-hover:bg-violet-500/[0.12]" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-400">
                <BrainCircuit size={19} />
              </div>

              <span className="flex items-center gap-1.5 rounded-lg border border-violet-400/10 bg-violet-400/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-400">
                <Zap size={10} />
                AI
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Total AI Predictions
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {predictions.toLocaleString()}
              </span>

              <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <TrendingUp size={11} />
                Active
              </span>
            </div>

            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-600">
              Recorded inference requests
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

              <span className="flex items-center gap-1.5 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                <ShieldCheck size={10} />
                {getConfidenceLabel(confidence)}
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Average Confidence
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

              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Engine Status
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-emerald-400">
                Online
              </span>
            </div>

            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-600">
              BioSync inference engine operational
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
                  Recent AI Inferences
                </h2>
              </div>

              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-600">
                {filteredInferences.length} inference
                {filteredInferences.length !== 1 ? 's' : ''} currently shown
              </p>
            </div>

            <div className="relative sm:w-[280px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search request or model..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400/50 focus:bg-white focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Model
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Request ID
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Prediction Type
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Confidence
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Timestamp
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-400 dark:border-slate-700 dark:border-t-violet-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading AI telemetry...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredInferences.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <BrainCircuit size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No inferences found
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        No recent AI inference records match your search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInferences.map((inference, index) => {
                  const inferenceConfidence =
                    (inference.confidence || 0.85) * 100;

                  const confidenceStyle =
                    getConfidenceClasses(inferenceConfidence);

                  const timestamp = inference.createdAt
                    ? new Date(inference.createdAt)
                    : null;

                  return (
                    <tr
                      key={inference._id || index}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Model */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07] text-violet-400">
                            <BrainCircuit size={16} />
                          </div>

                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              BioVision v2
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Request ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          {inference._id || 'Unknown'}
                        </span>
                      </td>

                      {/* Prediction type */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/[0.07] text-cyan-400">
                            <Activity size={13} />
                          </div>

                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Food Scanner Analysis
                          </span>
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="px-6 py-4">
                        <div className="flex min-w-[230px] items-center gap-3">
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
                            className={`rounded-lg border px-2 py-1 text-[9px] font-bold ${confidenceStyle.border} ${confidenceStyle.bg} ${confidenceStyle.text}`}
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
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {timestamp &&
                              !Number.isNaN(timestamp.getTime())
                                ? timestamp.toLocaleDateString(undefined, {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                              {timestamp &&
                              !Number.isNaN(timestamp.getTime())
                                ? timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                : ''}
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

        {!loading && filteredInferences.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredInferences.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {inferences.length}
              </span>{' '}
              recent inferences
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              AI engine operational
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AIAnalytics;