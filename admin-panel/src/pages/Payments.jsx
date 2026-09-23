import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Download,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  WalletCards,
  ChevronDown,
  Activity,
} from 'lucide-react';

import api from '../api/axios';

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/transactions');

      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((txn) => {
      const transactionId = txn.transactionId || txn._id || '';

      const patientName =
        `${txn.user?.firstName || ''} ${txn.user?.lastName || ''}`.trim();

      const paymentMethod = txn.paymentMethod || 'Card';
      const status = txn.status || 'Completed';

      const matchesSearch =
        !query ||
        transactionId.toLowerCase().includes(query) ||
        patientName.toLowerCase().includes(query) ||
        paymentMethod.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'All' ||
        status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  const stats = useMemo(() => {
    const completed = transactions.filter(
      (txn) => (txn.status || 'Completed').toLowerCase() === 'completed'
    );

    const pending = transactions.filter(
      (txn) => (txn.status || '').toLowerCase() === 'pending'
    );

    const failed = transactions.filter(
      (txn) => (txn.status || '').toLowerCase() === 'failed'
    );

    const totalRevenue = completed.reduce(
      (total, txn) => total + Number(txn.amount || 0),
      0
    );

    return {
      total: transactions.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalRevenue,
    };
  }, [transactions]);

  const formatDate = (date) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    return `$${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusConfig = (status) => {
    switch ((status || 'Completed').toLowerCase()) {
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          classes:
            'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400',
        };

      case 'pending':
        return {
          label: 'Pending',
          icon: Clock3,
          classes: 'border-amber-400/15 bg-amber-400/[0.08] text-amber-400',
        };

      case 'failed':
        return {
          label: 'Failed',
          icon: XCircle,
          classes: 'border-red-400/15 bg-red-400/[0.08] text-red-400',
        };

      default:
        return {
          label: status || 'Completed',
          icon: Activity,
          classes: 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">
              Financial Operations
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Payments & Transactions
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Monitor revenue, laboratory payments, and transaction activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            title="Refresh transactions"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
          </button>

          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(6,182,212,0.16)] transition-all hover:bg-cyan-400"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Financial overview */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
              <WalletCards size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Completed Revenue
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              {formatAmount(stats.totalRevenue)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600">
              From completed transactions
            </p>
          </div>
        </div>

        {/* Total */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-400">
              <CreditCard size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Transactions
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              {stats.total.toLocaleString()}
            </p>

            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600">
              Total payment records
            </p>
          </div>
        </div>

        {/* Completed */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400">
              <CheckCircle2 size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Completed
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-emerald-400">
              {stats.completed.toLocaleString()}
            </p>

            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600">
              Successfully processed
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/[0.07] blur-2xl" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.08] text-amber-400">
              <Clock3 size={19} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
              Pending
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-amber-400">
              {stats.pending.toLocaleString()}
            </p>

            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600">
              Awaiting processing
            </p>
          </div>
        </div>
      </section>

      {/* Transactions */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Transaction Ledger
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                {filteredTransactions.length} transaction
                {filteredTransactions.length !== 1 ? 's' : ''} currently shown
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative sm:w-[250px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transaction..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[145px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
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
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Transaction
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Date
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Amount
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Payment Method
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading transactions...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <CreditCard size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No transactions found
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try changing the search or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const transactionId =
                    txn.transactionId || txn._id || 'Unknown';

                  const patientName =
                    `${txn.user?.firstName || ''} ${
                      txn.user?.lastName || ''
                    }`.trim() || 'Unknown';

                  const statusConfig = getStatusConfig(txn.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={txn._id}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Transaction ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.07] text-blue-400">
                            <CreditCard size={16} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                              {transactionId}
                            </p>

                            <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-600">
                              <Activity size={9} />
                              Payment transaction
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={13}
                            className="text-slate-400 dark:text-slate-600"
                          />

                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {formatDate(txn.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.08] text-[9px] font-bold text-cyan-400">
                            {(txn.user?.firstName?.[0] || 'P').toUpperCase()}
                          </div>

                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {patientName}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                          {formatAmount(txn.amount)}
                        </span>
                      </td>

                      {/* Payment method */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-400/[0.07] text-slate-500 dark:text-slate-500">
                            <CreditCard size={13} />
                          </div>

                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {txn.paymentMethod || 'Card'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusConfig.classes}`}
                        >
                          <StatusIcon size={11} />
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredTransactions.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredTransactions.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {transactions.length}
              </span>{' '}
              transactions
            </p>

            <div className="flex items-center gap-3">
              {stats.failed > 0 && (
                <span className="text-[10px] font-medium text-red-400">
                  {stats.failed} failed
                </span>
              )}

              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Payment system synchronized
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Payments;