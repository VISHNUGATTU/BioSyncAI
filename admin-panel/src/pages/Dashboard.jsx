import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  FlaskConical,
  ArrowUpRight,
  CircleDot,
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

import api from '../api/axios';

const StatCard = ({ title, value, icon: Icon, tone }) => {
  const tones = {
    cyan: {
      icon: 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-300',
      glow: 'from-cyan-500/[0.08]',
    },
    emerald: {
      icon: 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300',
      glow: 'from-emerald-500/[0.07]',
    },
    amber: {
      icon: 'border-amber-400/15 bg-amber-400/[0.08] text-amber-300',
      glow: 'from-amber-500/[0.07]',
    },
    red: {
      icon: 'border-red-400/15 bg-red-400/[0.08] text-red-300',
      glow: 'from-red-500/[0.07]',
    },
  };

  const currentTone = tones[tone] || tones.cyan;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${currentTone.glow} via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${currentTone.icon}`}
        >
          <Icon size={21} strokeWidth={2} />
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-500">
            {title}
          </p>
        </div>

        <div className="ml-auto hidden self-start text-slate-300 transition-colors group-hover:text-slate-400 dark:text-slate-700 dark:group-hover:text-slate-500 sm:block">
          <ArrowUpRight size={16} />
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, icon: Icon }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-6">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
          <Icon size={17} strokeWidth={1.9} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-600 sm:block">
        Live data
      </div>
    </div>

    {children}
  </section>
);

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
    testTypesDistribution: [],
  });

  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [kpiRes, analyticsRes, alertsRes, logsRes] =
          await Promise.all([
            api.get('/admin/dashboard/kpis'),
            api.get('/admin/dashboard/analytics'),
            api.get('/admin/dashboard/alerts?limit=5'),
            api.get('/admin/logs?limit=5'),
          ]);

        if (kpiRes.data.success) {
          setKpis(kpiRes.data.data);
        }

        if (analyticsRes.data.success) {
          const {
            userRegistrations,
            testTypesDistribution,
          } = analyticsRes.data.data;

          const formattedUsers = userRegistrations.map((item) => ({
            name: item._id,
            users: item.count,
          }));

          const formattedTests = testTypesDistribution.map((item) => ({
            name: item._id || 'Unknown',
            count: item.count,
          }));

          setAnalytics({
            userRegistrations:
              formattedUsers.length > 0
                ? formattedUsers
                : [{ name: 'No Data', users: 0 }],

            testTypesDistribution:
              formattedTests.length > 0
                ? formattedTests
                : [{ name: 'No Data', count: 0 }],
          });
        }

        if (alertsRes.data.success) {
          setAlerts(alertsRes.data.data);
        }

        if (logsRes.data.success) {
          setLogs(logsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartGrid = 'rgba(148, 163, 184, 0.12)';
  const chartText = '#64748b';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Command Center
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Dashboard Overview
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Welcome back, Admin. Here&apos;s what&apos;s happening across
            BioSync today.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          System operational
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={kpis.totalUsers}
          icon={Users}
          tone="cyan"
        />

        <StatCard
          title="Tests Completed"
          value={kpis.testsCompleted}
          icon={CheckCircle}
          tone="emerald"
        />

        <StatCard
          title="Pending Tests"
          value={kpis.pendingTests}
          icon={Clock}
          tone="amber"
        />

        <StatCard
          title="Critical Alerts"
          value={kpis.criticalAlerts}
          icon={Activity}
          tone="red"
        />
      </div>

      {/* Main dashboard */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.95fr)]">
        {/* Charts */}
        <div className="min-w-0 space-y-6">
          <ChartCard
            title="User Registrations"
            subtitle="Registration activity over time"
            icon={TrendingUp}
          >
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />
                    Loading analytics...
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.userRegistrations}
                    margin={{
                      top: 8,
                      right: 10,
                      bottom: 5,
                      left: -20,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartGrid}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke={chartText}
                      tick={{
                        fontSize: 11,
                        fill: chartText,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      stroke={chartText}
                      allowDecimals={false}
                      tick={{
                        fontSize: 11,
                        fill: chartText,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      cursor={{
                        stroke: 'rgba(34, 211, 238, 0.15)',
                        strokeWidth: 1,
                      }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(71, 85, 105, 0.45)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                        fontSize: '12px',
                      }}
                      labelStyle={{
                        color: '#94a3b8',
                        marginBottom: '4px',
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: '#22d3ee',
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#22d3ee',
                        stroke: '#083344',
                        strokeWidth: 3,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Test Distribution"
            subtitle="Breakdown of completed laboratory tests"
            icon={FlaskConical}
          >
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-400 dark:border-slate-700 dark:border-t-emerald-400" />
                    Loading analytics...
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.testTypesDistribution}
                    margin={{
                      top: 8,
                      right: 10,
                      bottom: 5,
                      left: -20,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartGrid}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke={chartText}
                      tick={{
                        fontSize: 11,
                        fill: chartText,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      stroke={chartText}
                      allowDecimals={false}
                      tick={{
                        fontSize: 11,
                        fill: chartText,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      cursor={{
                        fill: 'rgba(34, 211, 238, 0.035)',
                      }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(71, 85, 105, 0.45)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                        fontSize: '12px',
                      }}
                      labelStyle={{
                        color: '#94a3b8',
                        marginBottom: '4px',
                      }}
                    />

                    <Legend
                      wrapperStyle={{
                        fontSize: '11px',
                        paddingTop: '8px',
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="Tests"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Alerts + activity */}
        <div className="min-w-0">
          <section className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
            {/* Alerts header */}
            <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800/80 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.07] text-red-400">
                    <AlertTriangle size={17} strokeWidth={1.9} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Critical Alerts
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                      Requires attention
                    </p>
                  </div>
                </div>

                <span className="rounded-lg border border-red-400/15 bg-red-400/[0.06] px-2 py-1 text-[10px] font-bold text-red-400">
                  {kpis.criticalAlerts}
                </span>
              </div>
            </div>

            {/* Alert list */}
            <div className="px-5 py-5 sm:px-6">
              {loading ? (
                <div className="flex items-center gap-3 py-3 text-sm text-slate-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-400 dark:border-slate-700 dark:border-t-red-400" />
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-800/20">
                  <CheckCircle
                    size={20}
                    className="mx-auto mb-2 text-emerald-400"
                  />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    No critical alerts
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600">
                    Everything looks clear right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alerts.map((alert, i) => (
                    <div
                      key={i}
                      className="group rounded-xl border border-red-400/10 bg-red-400/[0.035] p-3.5 transition-all hover:border-red-400/20 hover:bg-red-400/[0.055]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.55)]" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {alert.user?.firstName || 'Unknown'}{' '}
                              {alert.user?.lastName || ''}
                            </p>

                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-red-400">
                              Critical
                            </span>
                          </div>

                          <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-500">
                            {alert.criticalAlertDetails}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="px-5 py-5 sm:px-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                      Latest system events
                    </p>
                  </div>

                  <Activity
                    size={16}
                    className="text-slate-400 dark:text-slate-600"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />
                    Loading activity...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-800/20">
                    <p className="text-xs font-medium text-slate-500">
                      No recent activity
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute bottom-2 left-[3px] top-2 w-px bg-slate-200 dark:bg-slate-800" />

                    <div className="space-y-5">
                      {logs.map((log, i) => (
                        <div
                          key={log._id || i}
                          className="relative flex gap-3"
                        >
                          <div className="relative z-10 mt-0.5 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-cyan-400 ring-4 ring-white dark:ring-slate-900" />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-500">
                                <strong className="font-semibold text-slate-800 dark:text-slate-300">
                                  {log.action}
                                </strong>
                                {': '}
                                {log.details}
                              </p>

                              <span className="shrink-0 text-[9px] font-medium text-slate-400 dark:text-slate-600">
                                {new Date(
                                  log.createdAt
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Small operational strip */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-3.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/30 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2.5">
          <CircleDot
            size={14}
            className="text-emerald-400"
            fill="currentColor"
          />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500">
            BioSync infrastructure is operational
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-[10px] font-medium text-slate-400 dark:text-slate-600">
          <span>
            Lab assistants:{' '}
            <strong className="text-slate-600 dark:text-slate-400">
              {kpis.activeLabAssistants}
            </strong>
          </span>

          <span>
            Appointments today:{' '}
            <strong className="text-slate-600 dark:text-slate-400">
              {kpis.appointmentsToday}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;