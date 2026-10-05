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
  Eye,
  X,
  User,
  Calendar,
  Building,
  ShieldCheck,
  Receipt,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

import api from '../api/axios';

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

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
      const transactionId = (txn.transactionId || txn.gatewayTransactionId || txn._id || '').toLowerCase();
      const patientName = `${txn.user?.firstName || ''} ${txn.user?.lastName || ''}`.trim().toLowerCase();
      const paymentMethod = (txn.paymentMethod || txn.paymentGateway || 'Card').toLowerCase();
      const revenueType = (txn.revenueType || '').toLowerCase();
      const status = (txn.status || 'Pending').toLowerCase();

      const matchesSearch =
        !query ||
        transactionId.includes(query) ||
        patientName.includes(query) ||
        paymentMethod.includes(query) ||
        revenueType.includes(query);

      let matchesStatus = true;
      if (statusFilter === 'Completed' || statusFilter === 'Success') {
        matchesStatus = status === 'completed' || status === 'success';
      } else if (statusFilter !== 'All') {
        matchesStatus = status === statusFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  const stats = useMemo(() => {
    const completed = transactions.filter(
      (txn) => {
        const s = (txn.status || '').toLowerCase();
        return s === 'completed' || s === 'success';
      }
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
    if (Number.isNaN(parsedDate.getTime())) return '—';

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusConfig = (status) => {
    const s = (status || 'Pending').toLowerCase();
    switch (s) {
      case 'completed':
      case 'success':
        return {
          label: 'Success',
          icon: CheckCircle2,
          classes: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-500 dark:text-emerald-400',
        };

      case 'pending':
        return {
          label: 'Pending',
          icon: Clock3,
          classes: 'border-amber-400/20 bg-amber-400/10 text-amber-500 dark:text-amber-400',
        };

      case 'failed':
        return {
          label: 'Failed',
          icon: XCircle,
          classes: 'border-red-400/20 bg-red-400/10 text-red-500 dark:text-red-400',
        };

      case 'refunded':
        return {
          label: 'Refunded',
          icon: AlertCircle,
          classes: 'border-purple-400/20 bg-purple-400/10 text-purple-500 dark:text-purple-400',
        };

      default:
        return {
          label: status || 'Pending',
          icon: Activity,
          classes: 'border-slate-400/20 bg-slate-400/10 text-slate-500 dark:text-slate-400',
        };
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const exportCSV = () => {
    if (!filteredTransactions.length) return;
    const headers = ['Transaction ID', 'Gateway Reference', 'Patient Name', 'Patient Email', 'Amount (INR)', 'Status', 'Gateway', 'Revenue Type', 'Date'];
    const rows = filteredTransactions.map(t => [
      t.transactionId || t._id || '',
      t.gatewayTransactionId || 'N/A',
      `"${t.user?.firstName || ''} ${t.user?.lastName || ''}"`.trim(),
      t.user?.email || 'N/A',
      t.amount || 0,
      t.status || 'Pending',
      t.paymentGateway || t.paymentMethod || 'Razorpay',
      t.revenueType || 'Lab_Test',
      new Date(t.createdAt).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `biosync_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">
              Financial Operations & Billing
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Payments & Transactions
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Real-time ledger for diagnostic bookings, phlebotomy dispatches, and clinical consultations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            title="Refresh transactions"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!filteredTransactions.length}
            className="flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(6,182,212,0.16)] transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            Export Ledger (CSV)
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
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Gross Realized Revenue
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              {formatAmount(stats.totalRevenue)}
            </p>
            <p className="mt-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">
              Verified through Razorpay / Stripe
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
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Total Transactions
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              {stats.total.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
              All initiated payment entries
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
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Settled Successfully
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-emerald-500 dark:text-emerald-400">
              {stats.completed.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
              Settlement completed
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
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Pending Authorization
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-amber-500 dark:text-amber-400">
              {stats.pending.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
              Awaiting gateway confirmation
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
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                {filteredTransactions.length} transaction
                {filteredTransactions.length !== 1 ? 's' : ''} recorded
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative sm:w-[280px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search TXN ID, patient, gateway..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[160px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Success">Success (Settled)</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
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
                  Transaction ID / Gateway
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Date & Time
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Patient / Beneficiary
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Type
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Amount (INR)
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
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
                      <p className="text-xs font-medium text-slate-500">
                        Synchronizing financial ledger...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <CreditCard size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No transactions found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Try modifying search query or changing status filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const transactionId = txn.gatewayTransactionId || txn.transactionId || txn._id;
                  const patientName = `${txn.user?.firstName || ''} ${txn.user?.lastName || ''}`.trim() || 'Anonymous Patient';
                  const statusConfig = getStatusConfig(txn.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={txn._id}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20 cursor-pointer"
                      onClick={() => setSelectedTxn(txn)}
                    >
                      {/* Transaction ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.07] text-blue-500 dark:text-blue-400">
                            <CreditCard size={16} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                              {transactionId}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                              <ShieldCheck size={10} className="text-emerald-500" />
                              {txn.paymentGateway || 'Razorpay'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={13}
                            className="text-slate-400 dark:text-slate-500 shrink-0"
                          />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {formatDate(txn.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.1] text-[10px] font-bold text-cyan-500 dark:text-cyan-400">
                            {(txn.user?.firstName?.[0] || 'P').toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                              {patientName}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {txn.user?.phoneNumber || txn.user?.email || 'Registered User'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Revenue Type */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {txn.revenueType ? txn.revenueType.replace('_', ' ') : 'Lab Test'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                          {formatAmount(txn.amount)}
                        </span>
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

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(txn);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition-all hover:border-cyan-400 hover:text-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400 shadow-sm"
                        >
                          <Eye size={12} />
                          Inspect
                        </button>
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
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                {filteredTransactions.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                {transactions.length}
              </span>{' '}
              total payments
            </p>

            <div className="flex items-center gap-3">
              {stats.failed > 0 && (
                <span className="text-[10px] font-medium text-red-400">
                  {stats.failed} failed transactions
                </span>
              )}
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Ledger synced with payment gateway
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Transaction Inspection Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/95 sm:p-7">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Transaction Audit Record
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      ID: {selectedTxn.gatewayTransactionId || selectedTxn.transactionId || selectedTxn._id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedTxn.gatewayTransactionId || selectedTxn.transactionId || selectedTxn._id)}
                      className="text-slate-400 hover:text-cyan-500 transition-colors"
                      title="Copy Transaction ID"
                    >
                      {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusConfig(selectedTxn.status).classes}`}>
                  {getStatusConfig(selectedTxn.status).label}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="mt-6 space-y-6 max-h-[68vh] overflow-y-auto pr-1">
              {/* Patient & Beneficiary Card */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-800/30">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <User size={12} className="text-cyan-500" />
                  Patient Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Name</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedTxn.user?.firstName || '—'} {selectedTxn.user?.lastName || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Phone</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                      {selectedTxn.user?.phoneNumber || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Email</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                      {selectedTxn.user?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Linked Service / Appointment Info */}
              {selectedTxn.appointment && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-800/30">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                    <Calendar size={12} className="text-cyan-500" />
                    Linked Clinical Appointment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Service / Test</p>
                      <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5">
                        {selectedTxn.appointment.testCatalog?.testName || selectedTxn.appointment.appointmentType?.replace('_', ' ') || 'Diagnostic Lab Panel'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Scheduled Date & Slot</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        {new Date(selectedTxn.appointment.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {selectedTxn.appointment.timeSlot}
                      </p>
                    </div>
                    {selectedTxn.appointment.address && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Collection Location</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {selectedTxn.appointment.address.street}, {selectedTxn.appointment.address.city}, {selectedTxn.appointment.address.state} - {selectedTxn.appointment.address.postalCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gateway & Payment Breakdown */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-800/30">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <Building size={12} className="text-cyan-500" />
                  Financial & Gateway Settlement
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Payment Gateway</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedTxn.paymentGateway || 'Razorpay Payments'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Method</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                      {selectedTxn.paymentMethod || 'UPI / NetBanking'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Currency</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedTxn.currency || 'INR (₹)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Gateway Ref</p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                      {selectedTxn.gatewayTransactionId || 'pay_live_ref'}
                    </p>
                  </div>
                </div>

                {/* Amount breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Diagnostic Subtotal</span>
                    <span>{formatAmount(selectedTxn.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Healthcare GST (0% Exempted)</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Total Settled</span>
                    <span className="text-cyan-500 dark:text-cyan-400">{formatAmount(selectedTxn.amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;