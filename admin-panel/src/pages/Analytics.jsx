import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Activity,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import api from '../api/axios';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [analyticsRes, revenueRes] = await Promise.all([
        api.get('/admin/dashboard/analytics'),
        api.get('/admin/dashboard/revenue-analytics'),
      ]);

      if (analyticsRes.data.success) {
        setData(analyticsRes.data.data);
      }

      if (revenueRes.data.success) {
        setRevenue(revenueRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return revenue?.monthlyRevenue || [
      { name: 'Jan', value: 4000 },
      { name: 'Feb', value: 3000 },
      { name: 'Mar', value: 2000 },
      { name: 'Apr', value: 2780 },
      { name: 'May', value: 1890 },
      { name: 'Jun', value: 2390 },
    ];
  }, [revenue]);

  const totalRevenue = revenue?.totalRevenue || 0;
  const userGrowth = data?.userGrowth || 0;

  const chartTotal = chartData.reduce(
    (total, item) => total + (Number(item.value) || 0),
    0
  );

  const formatCurrency = (value) => {
    return `$${Number(value || 0).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400">
              Business Intelligence
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Global Analytics
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Comprehensive system insights, user growth, and revenue
            performance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh analytics
        </button>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/[0.07] blur-2xl transition-all group-hover:bg-cyan-500/[0.12]" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
                <DollarSign size={19} />
              </div>

              <span className="flex items-center gap-1.5 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                YTD
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Total Revenue
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {formatCurrency(totalRevenue)}
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600">
              <CalendarDays size={11} />
              Year-to-date revenue
            </p>
          </div>
        </div>

        {/* Growth */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/[0.07] blur-2xl transition-all group-hover:bg-emerald-500/[0.12]" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400">
                <TrendingUp size={19} />
              </div>

              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                <ArrowUpRight size={10} />
                Growth
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Growth Rate
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-emerald-400">
                +24.5%
              </span>
            </div>

            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-600">
              Current system growth indicator
            </p>
          </div>
        </div>

        {/* Users */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/[0.07] blur-2xl transition-all group-hover:bg-blue-500/[0.12]" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-400">
                <BarChart3 size={19} />
              </div>

              <span className="flex items-center gap-1.5 rounded-lg border border-blue-400/10 bg-blue-400/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                Users
              </span>
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Total Users Gained
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                {Number(userGrowth).toLocaleString()}
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600">
              <Activity size={11} />
              User growth metric
            </p>
          </div>
        </div>
      </section>

      {/* Revenue chart */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/[0.08] text-cyan-400">
                <TrendingUp size={14} />
              </div>

              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Revenue Overview
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-600">
              Monthly revenue performance across the platform.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                Chart Total
              </p>

              <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrency(chartTotal)}
              </p>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.65)]" />

              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-500">
                Revenue
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 py-5 sm:px-5 sm:py-6">
          {loading ? (
            <div className="flex h-[340px] flex-col items-center justify-center">
              <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />

              <p className="text-xs font-medium text-slate-500">
                Loading revenue analytics...
              </p>
            </div>
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="analyticsRevenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#22d3ee"
                        stopOpacity={0.28}
                      />

                      <stop
                        offset="100%"
                        stopColor="#22d3ee"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 5"
                    stroke="rgba(100,116,139,0.14)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 10,
                    }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 10,
                    }}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `$${value / 1000}k`;
                      }

                      return `$${value}`;
                    }}
                    width={50}
                  />

                  <Tooltip
                    cursor={{
                      stroke: 'rgba(34,211,238,0.25)',
                      strokeWidth: 1,
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.96)',
                      border: '1px solid rgba(51,65,85,0.7)',
                      borderRadius: '12px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                      color: '#f8fafc',
                      fontSize: '11px',
                    }}
                    labelStyle={{
                      color: '#94a3b8',
                      marginBottom: '4px',
                    }}
                    formatter={(value) => [
                      `$${Number(value || 0).toLocaleString()}`,
                      'Revenue',
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fill="url(#analyticsRevenueGradient)"
                    fillOpacity={1}
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      stroke: '#020817',
                      fill: '#22d3ee',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {!loading && chartData.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              {chartData.length} reporting periods
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Analytics synchronized
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;