import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

import {
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

// Fetch API Key and Map ID securely from environment variables
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

const StatCard = ({ title, value, icon: Icon, tone, suffix = '' }) => {
  const tones = {
    cyan: { icon: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
    emerald: { icon: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    amber: { icon: 'text-amber-600 bg-amber-50 border-amber-100' },
    red: { icon: 'text-red-600 bg-red-50 border-red-100' },
  };

  const currentTone = tones[tone] || tones.cyan;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md">
      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm ${currentTone.icon}`}>
          <Icon size={21} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="flex items-baseline gap-1 text-2xl font-extrabold tracking-tight text-slate-900">
            {value} <span className="text-sm font-medium text-slate-500">{suffix}</span>
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
        </div>
        <div className="ml-auto hidden self-start text-slate-300 transition-colors group-hover:text-cyan-600 sm:block">
          <ArrowUpRight size={16} strokeWidth={2.5} />
        </div>
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
    <section className="relative flex h-[380px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-xl">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/60 bg-white/60 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-600 shadow-sm">
            <MapPin size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Live Active User Density</h2>
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              {densestArea ? (
                <>
                  Highest density: <strong className="text-slate-800">{densestArea.area || 'Unknown'}</strong> ({densestArea.userCount} active users)
                </>
              ) : (
                'Monitoring regional clusters...'
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
            Overview
          </button>
          {densestArea && (
            <button
              type="button"
              onClick={() => setMapTarget({ center: { lat: densestArea.lat, lng: densestArea.lng }, zoom: 13 })}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700 shadow-sm transition hover:bg-cyan-100"
            >
              <Radio size={12} className="animate-pulse" />
              Focus Dense Area
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
              const markerSize = Math.max(24, Math.min(56, (cluster.userCount || 0) / 2));

              return (
                <AdvancedMarker
                  key={cluster.id || index}
                  position={{ lat: cluster.lat, lng: cluster.lng }}
                >
                  <div className="group relative flex cursor-pointer flex-col items-center justify-center">
                    
                    {/* Map Pin Container */}
                    <div className="relative flex flex-col items-center justify-center transition-transform hover:scale-110 hover:-translate-y-1">
                      
                      {/* Pulse effect for peak density */}
                      {isDensest && (
                        <div className="absolute top-0 inline-flex h-12 w-12 animate-ping rounded-full bg-cyan-400 opacity-40" />
                      )}

                      {/* Pin Circle with Logo */}
                      <div className={`relative z-10 flex items-center justify-center rounded-full border-2 bg-white shadow-lg transition-colors ${
                        isDensest ? 'h-12 w-12 border-cyan-400' : 'h-10 w-10 border-slate-300'
                      }`}>
                        <img 
                          src="/images/Logo.png" 
                          alt="BioSync Pin" 
                          className="h-full w-full rounded-full object-contain p-1.5" 
                        />
                      </div>

                      {/* Pin Pointer (Triangle) */}
                      <div className={`-mt-1.5 h-3 w-3 rotate-45 border-b-2 border-r-2 bg-white shadow-sm transition-colors ${
                        isDensest ? 'border-cyan-400' : 'border-slate-300'
                      }`} />
                    </div>

                    {/* Tooltip Overlay */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="whitespace-nowrap rounded-lg border border-white/80 bg-white/95 px-2.5 py-1.5 text-center font-sans shadow-xl backdrop-blur-md">
                        <p className="font-bold text-slate-900">{cluster.area || 'Active Region'}</p>
                        <p className="text-[11px] font-semibold text-cyan-600">
                          {cluster.userCount} Active Users
                        </p>
                        {isDensest && (
                          <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                            Peak Density
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
            <p className="text-[11px] font-semibold text-slate-500">Real-time node response times</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          <CircleDot size={10} className="animate-pulse" />
          Healthy
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/80 bg-white/60 p-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <Database size={15} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Database</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {health.dbLatency} <span className="text-xs font-semibold text-slate-500">ms</span>
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                health.dbLatency > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (health.dbLatency / 100) * 100)}%` }}
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
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (health.apiLatency / 150) * 100)}%` }}
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
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (health.cacheLatency / 50) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const Dashboard = () => {
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    activeLabAssistants: 0,
    testsCompleted: 0,
    pendingTests: 0,
    criticalAlerts: 0,
    totalRevenue: 0,
    appointmentsToday: 0,
  });

  const [analytics, setAnalytics] = useState({
    userRegistrations: [],
  });

  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userClusters, setUserClusters] = useState([]); 
  
  const [health, setHealth] = useState({
    dbLatency: 14,
    apiLatency: 28,
    cacheLatency: 4,
  });

  const densestArea = useMemo(() => {
    if (!userClusters || !userClusters.length) return null;
    return userClusters.reduce((max, cluster) =>
      (cluster.userCount || 0) > (max.userCount || 0) ? cluster : max
    );
  }, [userClusters]);

  useEffect(() => {
    let isMounted = true;

    const fetchRealtimeData = async () => {
      const startTime = performance.now();
      try {
        const [kpiRes, analyticsRes, alertsRes, logsRes, locationsRes, healthRes] = await Promise.allSettled([
          api.get('/admin/dashboard/kpis'),
          api.get('/admin/dashboard/analytics'),
          api.get('/admin/dashboard/alerts?limit=5'),
          api.get('/admin/logs?limit=5'),
          api.get('/admin/dashboard/locations'), 
          api.get('/admin/dashboard/system-health'),
        ]);

        const measuredLatency = Math.round(performance.now() - startTime);

        if (isMounted) {
          if (kpiRes.status === 'fulfilled' && kpiRes.value?.data?.success) {
            setKpis(kpiRes.value.data.data);
          }
          if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data?.success) {
            const { userRegistrations } = analyticsRes.value.data.data;
            setAnalytics({
              userRegistrations: (userRegistrations || []).map((item) => ({
                name: item._id,
                users: item.count,
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
            dbLatency: dbLatency,
            cacheLatency: cacheLatency,
          });
        }
      } catch (err) {
        console.error('Error polling dashboard telemetries:', err);
      }
    };

    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              Live Command Center
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Real-Time Infrastructure
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Streaming diagnostics, active user locations, and critical healthcare systems.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Live Stream Active
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Registered Users" value={kpis.totalUsers} icon={Users} tone="cyan" />
        <StatCard title="Tests Completed" value={kpis.testsCompleted} icon={CheckCircle} tone="emerald" />
        <StatCard title="Pending Laboratory Tests" value={kpis.pendingTests} icon={Clock} tone="amber" />
        <StatCard title="Critical Alerts" value={kpis.criticalAlerts} icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
        <div className="flex min-w-0 flex-col space-y-6">
          <LiveUserMap userClusters={userClusters} densestArea={densestArea} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SystemHealth health={health} />

            <section className="flex flex-col justify-between rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-600 shadow-sm">
                    <TrendingUp size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">User Flow</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Live platform signups</p>
                  </div>
                </div>
              </div>

              <div className="h-[140px] w-full">
                {analytics.userRegistrations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.userRegistrations}
                      margin={{ top: 5, right: 5, bottom: 0, left: -25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '10px',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                          fontSize: '11px',
                        }}
                      />
                      <Line type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: '#0ea5e9' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    Awaiting registration signals...
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="min-w-0">
          <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 shadow-sm">
                  <AlertTriangle size={18} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Critical Patient Alerts</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Requires clinical response</p>
                </div>
              </div>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                {alerts.length} Active
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/40 px-4 py-10 text-center">
                  <CheckCircle size={28} className="text-emerald-500" />
                  <p className="mt-2 text-xs font-bold text-slate-700">No active critical alerts</p>
                  <p className="text-[11px] text-slate-400">Patient markers are within standard bounds.</p>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div
                    key={alert._id || idx}
                    className="flex items-start gap-3 rounded-xl border border-red-100 bg-white/80 p-3.5 shadow-sm backdrop-blur-md"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-ping" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs font-bold text-slate-800">
                          {alert.user?.firstName} {alert.user?.lastName}
                        </p>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-red-500">
                          Critical
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        {alert.criticalAlertDetails}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {logs.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Latest Operations
                  </h3>
                  <div className="space-y-2">
                    {logs.slice(0, 3).map((log, idx) => (
                      <div key={log._id || idx} className="flex items-center justify-between text-[11px]">
                        <span className="truncate font-medium text-slate-700">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/60 bg-white/50 px-5 py-3.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-cyan-600 animate-pulse" />
                  <span className="font-semibold text-slate-700">BioSync Node Active</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {kpis.activeLabAssistants} Lab Assistants Online
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