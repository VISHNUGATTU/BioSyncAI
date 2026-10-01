import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  CircleDot,
  MapPin,
  Database,
  Server,
  Wifi,
  Radio,
  Layers,
  RefreshCw,
  DollarSign,
  Truck,
  FlaskConical,
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Pause,
  Play,
  IndianRupee,
  Navigation,
  FileText,
  Calendar,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import api from '../api/axios';

const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_ID = import.meta.env?.VITE_GOOGLE_MAPS_ID || '';

const GoogleMapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const StatCard = ({ title, value, subtext, icon: Icon, tone, suffix = '', onClick }) => {
  const tones = {
    cyan:    'text-cyan-600 bg-cyan-50/80 border-cyan-100',
    emerald: 'text-emerald-600 bg-emerald-50/80 border-emerald-100',
    amber:   'text-amber-600 bg-amber-50/80 border-amber-100',
    red:     'text-red-500 bg-red-50/80 border-red-100',
    indigo:  'text-indigo-600 bg-indigo-50/80 border-indigo-100',
    purple:  'text-purple-600 bg-purple-50/80 border-purple-100',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-white/65 bg-white/45
        p-4 sm:p-5 shadow-sm backdrop-blur-xl transition-all duration-200
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-md' : ''}`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-xs ${tones[tone] || tones.cyan}`}>
          <Icon size={19} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1 text-[21px] font-extrabold tracking-tight text-slate-900">
            {value}
            {suffix && <span className="text-xs font-semibold text-slate-400">{suffix}</span>}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          {subtext && (
            <p className="mt-0.5 truncate text-[10.5px] font-medium text-slate-400">
              {subtext}
            </p>
          )}
        </div>
        {onClick && (
          <ArrowUpRight size={15} strokeWidth={2.5} className="hidden shrink-0 text-slate-300 transition-colors group-hover:text-cyan-500 sm:block" />
        )}
      </div>
    </div>
  );
};

const LiveUserMap = ({ userClusters, densestArea }) => {
  const HYDERABAD_COORDS = { lat: 17.3850, lng: 78.4867 };
  const [mapTarget, setMapTarget] = useState({ center: HYDERABAD_COORDS, zoom: 11 });

  useEffect(() => {
    if (densestArea && densestArea.lat && densestArea.lng) {
      setMapTarget({ center: { lat: densestArea.lat, lng: densestArea.lng }, zoom: 13 });
    }
  }, [densestArea]);

  return (
    <section className="relative flex h-[360px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-xl">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/60 bg-white/60 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-600 shadow-sm">
            <MapPin size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Field Dispatch & User Density</h2>
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              {densestArea ? (
                <>
                  Highest density: <strong className="text-slate-800">{densestArea.area || 'Active Zone'}</strong> ({densestArea.userCount} active patients)
                </>
              ) : (
                'Monitoring active metropolitan clusters...'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapTarget({ center: HYDERABAD_COORDS, zoom: 11 })}
            className="rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-cyan-600"
          >
            Regional View
          </button>
          {densestArea && (
            <button
              type="button"
              onClick={() => setMapTarget({ center: { lat: densestArea.lat, lng: densestArea.lng }, zoom: 13 })}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700 shadow-sm transition hover:bg-cyan-100"
            >
              <Radio size={12} className="animate-pulse" />
              Focus Zone
            </button>
          )}
        </div>
      </div>

      <div className="relative z-0 h-full w-full bg-slate-50">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={HYDERABAD_COORDS}
            defaultZoom={11}
            mapId={GOOGLE_MAPS_ID}
            disableDefaultUI={true}
            gestureHandling="cooperative"
          >
            <GoogleMapController center={mapTarget.center} zoom={mapTarget.zoom} />

            {userClusters.map((cluster, index) => {
              const isDensest = densestArea?.id === cluster.id;

              return (
                <AdvancedMarker
                  key={cluster.id || index}
                  position={{ lat: cluster.lat, lng: cluster.lng }}
                >
                  <div className="group relative flex cursor-pointer flex-col items-center justify-center">
                    <div className="relative flex flex-col items-center justify-center transition-transform hover:scale-110 hover:-translate-y-1">
                      {isDensest && (
                        <div className="absolute top-0 inline-flex h-12 w-12 animate-ping rounded-full bg-cyan-400 opacity-40" />
                      )}

                      <div className={`relative z-10 flex items-center justify-center rounded-full border-2 bg-white shadow-lg transition-colors ${
                        isDensest ? 'h-11 w-11 border-cyan-400' : 'h-9 w-9 border-slate-300'
                      }`}>
                        <img 
                          src="/images/Logo.png" 
                          alt="BioSync Pin" 
                          className="h-full w-full rounded-full object-contain p-1.5" 
                        />
                      </div>

                      <div className={`-mt-1.5 h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 bg-white shadow-sm transition-colors ${
                        isDensest ? 'border-cyan-400' : 'border-slate-300'
                      }`} />
                    </div>

                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="whitespace-nowrap rounded-lg border border-white/80 bg-white/95 px-2.5 py-1.5 text-center font-sans shadow-xl backdrop-blur-md">
                        <p className="font-bold text-slate-900">{cluster.area || 'Active Cluster'}</p>
                        <p className="text-[11px] font-semibold text-cyan-600">
                          {cluster.userCount} Active Patients
                        </p>
                        {isDensest && (
                          <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                            Peak Demand Area
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        </APIProvider>
      </div>
    </section>
  );
};

const SystemHealth = ({ health }) => {
  return (
    <section className="flex flex-col justify-between rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm">
            <Server size={18} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">System Telemetry</h2>
            <p className="text-[11px] font-semibold text-slate-500">Node cluster response latency</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          <CircleDot size={10} className="animate-pulse" />
          Optimal
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/80 bg-white/60 p-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <Database size={15} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">MongoDB</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {health.dbLatency} <span className="text-xs font-semibold text-slate-500">ms</span>
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                health.dbLatency > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (health.dbLatency / 80) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/80 bg-white/60 p-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <Wifi size={15} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Gateway</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {health.apiLatency} <span className="text-xs font-semibold text-slate-500">ms</span>
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                health.apiLatency > 80 ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(100, (health.apiLatency / 120) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/80 bg-white/60 p-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <Layers size={15} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Cache</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {health.cacheLatency} <span className="text-xs font-semibold text-slate-500">ms</span>
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (health.cacheLatency / 20) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState({
    totalUsers: 0,
    activeLabAssistants: 0,
    testsCompleted: 0,
    pendingTests: 0,
    criticalAlerts: 0,
    totalRevenue: 0,
    appointmentsToday: 0,
    stages: {
      pending: 0,
      assigned: 0,
      onTheWay: 0,
      arrived: 0,
      collecting: 0,
      collected: 0,
      atLaboratory: 0,
      completed: 0,
      cancelled: 0,
    },
    fleet: {
      available: 0,
      onRoute: 0,
      collecting: 0,
      offDuty: 0,
      totalActive: 0,
    },
    revenueBreakdown: {
      online: 0,
      cashOnDelivery: 0,
      total: 0,
    },
  });

  const [analytics, setAnalytics] = useState({
    userRegistrations: [],
    dailyAppointments: [],
    specimenDistribution: [],
  });

  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userClusters, setUserClusters] = useState([]);
  const [resolvingAlertId, setResolvingAlertId] = useState(null);

  const [health, setHealth] = useState({
    dbLatency: 14,
    apiLatency: 28,
    cacheLatency: 4,
  });

  // Polling Interval State (5s, 15s, 30s, or 0 = paused)
  const [pollInterval, setPollInterval] = useState(5000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  const densestArea = useMemo(() => {
    if (!userClusters || !userClusters.length) return null;
    return userClusters.reduce((max, cluster) =>
      (cluster.userCount || 0) > (max.userCount || 0) ? cluster : max
    );
  }, [userClusters]);

  const fetchRealtimeData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    const startTime = performance.now();

    try {
      const [kpiRes, analyticsRes, alertsRes, logsRes, locationsRes, healthRes] = await Promise.allSettled([
        api.get('/admin/dashboard/kpis'),
        api.get('/admin/dashboard/analytics'),
        api.get('/admin/dashboard/alerts?limit=6'),
        api.get('/admin/logs?limit=5'),
        api.get('/admin/dashboard/locations'),
        api.get('/admin/dashboard/system-health'),
      ]);

      const measuredLatency = Math.round(performance.now() - startTime);

      if (kpiRes.status === 'fulfilled' && kpiRes.value?.data?.success) {
        setKpis((prev) => ({
          ...prev,
          ...kpiRes.value.data.data,
        }));
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data?.success) {
        const { userRegistrations, dailyAppointments, specimenDistribution } = analyticsRes.value.data.data;
        setAnalytics({
          userRegistrations: (userRegistrations || []).map((item) => ({
            name: item._id,
            users: item.count,
          })),
          dailyAppointments: (dailyAppointments || []).map((item) => ({
            date: item._id,
            appointments: item.count,
          })),
          specimenDistribution: (specimenDistribution || []).map((item) => ({
            name: item._id || 'Standard Blood',
            count: item.count,
          })),
        });
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value?.data?.success) {
        setAlerts(alertsRes.value.data.data || []);
      }

      if (logsRes.status === 'fulfilled' && logsRes.value?.data?.success) {
        setLogs(logsRes.value.data.data || []);
      }

      if (locationsRes.status === 'fulfilled' && locationsRes.value?.data?.success) {
        setUserClusters(locationsRes.value.data.data || []);
      }

      let dbLatency = 12;
      let cacheLatency = 3;
      if (healthRes.status === 'fulfilled' && healthRes.value?.data?.success) {
        const hData = healthRes.value.data.data;
        dbLatency = hData.metrics?.dbResponseTimeMs || 12;
      }

      setHealth({
        apiLatency: measuredLatency > 0 ? measuredLatency : 28,
        dbLatency,
        cacheLatency,
      });

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Error fetching dashboard telemetries:', err);
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRealtimeData();

    if (pollInterval > 0) {
      const interval = setInterval(() => fetchRealtimeData(), pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, fetchRealtimeData]);

  // Action: Resolve Alert Directly
  const handleResolveAlert = async (vitalsId, alertDetailId) => {
    try {
      setResolvingAlertId(alertDetailId || vitalsId);
      const res = await api.put(`/admin/dashboard/alerts/${vitalsId}`, {
        alertId: alertDetailId,
        status: 'Resolved',
      });
      if (res.data?.success) {
        setAlerts((prev) => prev.filter((a) => a.vitalsId !== vitalsId || (alertDetailId && a.alertDetailId !== alertDetailId)));
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingAlertId(null);
    }
  };

  // 8 Canonical Stages for the State Machine Funnel
  const lifecycleStages = [
    { id: 'Pending', label: '1. Booked', count: kpis.stages?.pending || 0, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-500' },
    { id: 'Assigned', label: '2. Assigned', count: kpis.stages?.assigned || 0, color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', text: 'text-cyan-500' },
    { id: 'On_The_Way', label: '3. En Route', count: kpis.stages?.onTheWay || 0, color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-500' },
    { id: 'Arrived', label: '4. Arrived', count: kpis.stages?.arrived || 0, color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', text: 'text-indigo-500' },
    { id: 'Collecting', label: '5. Collecting', count: kpis.stages?.collecting || 0, color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/25', text: 'text-purple-500' },
    { id: 'Sample_Collected', label: '6. Secured', count: kpis.stages?.collected || 0, color: '#14b8a6', bg: 'bg-teal-500/10', border: 'border-teal-500/25', text: 'text-teal-500' },
    { id: 'At_Laboratory', label: '7. At Lab', count: kpis.stages?.atLaboratory || 0, color: '#8b5cf6', bg: 'bg-violet-500/10', border: 'border-violet-500/25', text: 'text-violet-500' },
    { id: 'Completed', label: '8. Complete', count: kpis.stages?.completed || 0, color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-500' },
  ];

  const totalActiveInPipeline = useMemo(() => {
    return (kpis.stages?.pending || 0) +
      (kpis.stages?.assigned || 0) +
      (kpis.stages?.onTheWay || 0) +
      (kpis.stages?.arrived || 0) +
      (kpis.stages?.collecting || 0) +
      (kpis.stages?.collected || 0) +
      (kpis.stages?.atLaboratory || 0);
  }, [kpis.stages]);

  const SPECIMEN_COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* HEADER: Title & Polling Control Strip                         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              Operational Fleet & Diagnostics Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Live Healthcare Command Center
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time phlebotomist fleet monitoring, 8-stage state machine throughput, and clinical safety alerts.
          </p>
        </div>

        {/* Polling & Manual Refresh Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh interval selector */}
          <div className="flex items-center gap-1 rounded-xl border border-white/70 bg-white/60 p-1 shadow-xs backdrop-blur-md">
            {[
              { label: '5s', val: 5000 },
              { label: '15s', val: 15000 },
              { label: '30s', val: 30000 },
              { label: 'Off', val: 0 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPollInterval(p.val)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  pollInterval === p.val
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {p.val === 0 ? <Pause size={10} className="inline mr-1" /> : null}
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchRealtimeData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-cyan-600 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-cyan-500' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. PRIMARY MULTI-DIMENSIONAL KPI STRIP                        */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Registered Patients"
          value={kpis.totalUsers}
          subtext="Verified health accounts"
          icon={Users}
          tone="cyan"
          onClick={() => navigate('/users')}
        />

        <StatCard
          title="Diagnostic Revenue"
          value={`₹${(kpis.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtext={`Online: ₹${((kpis.revenueBreakdown?.online || 0) / 1000).toFixed(1)}k · COD: ₹${((kpis.revenueBreakdown?.cashOnDelivery || 0) / 1000).toFixed(1)}k`}
          icon={IndianRupee}
          tone="emerald"
          onClick={() => navigate('/payments')}
        />

        <StatCard
          title="Active Field Fleet"
          value={kpis.fleet?.totalActive || kpis.activeLabAssistants}
          subtext={`Free: ${kpis.fleet?.available || 0} · Transit: ${kpis.fleet?.onRoute || 0} · In Lab: ${kpis.fleet?.collecting || 0}`}
          icon={Truck}
          tone="indigo"
          onClick={() => navigate('/lab-assistants')}
        />

        <StatCard
          title="Lab Tests Completed"
          value={kpis.testsCompleted}
          subtext={`${kpis.pendingTests} in active testing queue`}
          icon={CheckCircle}
          tone="purple"
          onClick={() => navigate('/samples')}
        />

        <StatCard
          title="Critical Alerts"
          value={kpis.criticalAlerts}
          subtext={kpis.criticalAlerts > 0 ? 'Requires urgent medical check' : 'All biomarkers stable'}
          icon={AlertTriangle}
          tone="red"
          onClick={() => navigate('/alerts')}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. 8-STAGE STRICT STATE MACHINE LIFECYCLE PIPELINE            */}
      {/* ------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-2xl border border-white/65 bg-white/45 p-5 shadow-sm backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500" />
              <h2 className="text-sm font-bold text-slate-900">8-Stage Strict State Machine Lifecycle Throughput</h2>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Guarded progression tracking from online booking to automated biomarker report generation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-bold text-slate-700">
              {totalActiveInPipeline} Active Visits in Flight
            </span>
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:text-cyan-700"
            >
              <span>Manage Queue</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* 8-Stage Stepper Nodes Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {lifecycleStages.map((stage, idx) => {
            return (
              <div
                key={stage.id}
                onClick={() => navigate(`/appointments?status=${stage.id}`)}
                className={`group relative flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition-all duration-150
                  hover:-translate-y-0.5 hover:shadow-xs ${stage.bg} ${stage.border}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${stage.text}`}>
                    Stage {idx + 1}
                  </span>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>

                <div className="my-2">
                  <p className="text-xl font-extrabold text-slate-900">
                    {stage.count}
                  </p>
                  <p className="truncate text-[11px] font-bold text-slate-700">
                    {stage.label.replace(/^\d+\.\s*/, '')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] font-medium text-slate-500">
                  <span>{totalActiveInPipeline > 0 ? `${Math.round((stage.count / totalActiveInPipeline) * 100)}%` : '0%'}</span>
                  <ChevronRight size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN WORKSPACE: MAP & DUAL CHARTS + RIGHT ALERT FEED       */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
        {/* Left Column: Live Map + Dual Analytics Charts + Telemetry */}
        <div className="flex min-w-0 flex-col space-y-6">
          {/* Live Patient & Dispatch Density Map */}
          <LiveUserMap userClusters={userClusters} densestArea={densestArea} />

          {/* Dual Analytics Row: 14-Day Appointment Flow + Specimen Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 14-Day Appointment & Intake Trend */}
            <section className="flex flex-col justify-between rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-600 shadow-sm">
                    <TrendingUp size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">14-Day Intake Velocity</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Scheduled sample collection visits</p>
                  </div>
                </div>
              </div>

              <div className="h-[150px] w-full">
                {analytics.dailyAppointments.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.dailyAppointments}
                      margin={{ top: 5, right: 5, bottom: 0, left: -25 }}
                    >
                      <defs>
                        <linearGradient id="appointmentColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '10px',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                          fontSize: '11px',
                        }}
                      />
                      <Area type="monotone" dataKey="appointments" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#appointmentColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    Collecting historical trends...
                  </div>
                )}
              </div>
            </section>

            {/* Specimen Pipeline Distribution */}
            <section className="flex flex-col justify-between rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                    <FlaskConical size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Specimens By Body Fluid</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Physical sample volume breakdown</p>
                  </div>
                </div>
              </div>

              <div className="h-[150px] w-full">
                {analytics.specimenDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.specimenDistribution}
                      margin={{ top: 5, right: 5, bottom: 0, left: -25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '10px',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {analytics.specimenDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SPECIMEN_COLORS[index % SPECIMEN_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    Awaiting specimen accession scans...
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* System Telemetry & Cluster Node Latencies */}
          <SystemHealth health={health} />
        </div>

        {/* Right Column: Actionable Alerts & Fleet Utilization Feed */}
        <div className="min-w-0">
          <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-xl">
            {/* Critical Patient Alerts Header */}
            <div className="flex items-center justify-between border-b border-white/60 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 shadow-sm">
                  <AlertTriangle size={18} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Critical Patient Alerts</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Real-time vital threshold breaches</p>
                </div>
              </div>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                {alerts.length} Active
              </span>
            </div>

            {/* Alert List */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5 max-h-[460px]">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/40 px-4 py-10 text-center">
                  <CheckCircle size={28} className="text-emerald-500" />
                  <p className="mt-2 text-xs font-bold text-slate-700">No active critical alerts</p>
                  <p className="text-[11px] text-slate-400">All physical biomarker readings are within normal thresholds.</p>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div
                    key={alert._id || idx}
                    className="flex flex-col gap-2 rounded-xl border border-red-100 bg-white/85 p-3.5 shadow-sm backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-ping" />
                        <p className="truncate text-xs font-bold text-slate-800">
                          {alert.patientName || alert.user?.firstName || 'Patient'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alert.vitalsId, alert.alertDetailId)}
                        disabled={resolvingAlertId === (alert.alertDetailId || alert.vitalsId)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-xs hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-50"
                      >
                        {resolvingAlertId === (alert.alertDetailId || alert.vitalsId) ? 'Saving...' : 'Resolve'}
                      </button>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {alert.description || alert.criticalAlertDetails || 'Critical biometric reading detected.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{alert.patientPhone !== 'N/A' ? alert.patientPhone : 'Phone on file'}</span>
                      <span>
                        {alert.recordedAt ? new Date(alert.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Fleet Operations Overview Bar */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-white/70 p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Phlebotomist Fleet Utilization
                  </span>
                  <span className="text-[11px] font-extrabold text-cyan-600">
                    {kpis.fleet?.totalActive || 0} Online
                  </span>
                </div>

                <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 gap-0.5">
                  <div
                    title="Available"
                    className="bg-emerald-500"
                    style={{ width: `${kpis.fleet?.totalActive ? (kpis.fleet.available / kpis.fleet.totalActive) * 100 : 33}%` }}
                  />
                  <div
                    title="En Route"
                    className="bg-blue-500"
                    style={{ width: `${kpis.fleet?.totalActive ? (kpis.fleet.onRoute / kpis.fleet.totalActive) * 100 : 33}%` }}
                  />
                  <div
                    title="Collecting"
                    className="bg-purple-500"
                    style={{ width: `${kpis.fleet?.totalActive ? (kpis.fleet.collecting / kpis.fleet.totalActive) * 100 : 34}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Available ({kpis.fleet?.available || 0})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    En Route ({kpis.fleet?.onRoute || 0})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Collecting ({kpis.fleet?.collecting || 0})
                  </span>
                </div>
              </div>

              {/* System Audit Operations Feed */}
              {logs.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    System Audit Trace
                  </h3>
                  <div className="space-y-1.5">
                    {logs.slice(0, 4).map((log, idx) => (
                      <div key={log._id || idx} className="flex items-center justify-between text-[10.5px]">
                        <span className="truncate font-medium text-slate-700">{log.action}</span>
                        <span className="text-[9.5px] text-slate-400 shrink-0 ml-2">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Node Status */}
            <div className="border-t border-white/60 bg-white/50 px-5 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-cyan-600 animate-pulse" />
                  <span className="font-semibold text-slate-700">BioSync AI Core Active</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Sync: {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;