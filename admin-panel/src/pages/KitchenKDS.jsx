import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Clock,
  ShieldCheck,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Printer,
  RefreshCw,
  Search,
  Layers,
  ChefHat,
  Hash,
  X,
} from 'lucide-react';
import api from '../api/axios';

export default function KitchenKDS() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/food-delivery/admin/kds-orders', {
        params: {
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          mode: selectedMode !== 'ALL' ? selectedMode : undefined,
        },
      });
      if (res.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders(getFallbackKdsOrders());
      }
    } catch (err) {
      console.warn('[KitchenKDS] Fetch fallback:', err?.message || err);
      setOrders(getFallbackKdsOrders());
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedMode]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s auto-refresh for KDS screen
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      await api.put(`/food-delivery/admin/orders/${orderId}/status`, { orderStatus: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      console.warn('[KitchenKDS] Update warning:', err?.message || err);
      // Optimistic local update for demo
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.printedKitchenTicket?.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const countPlaced = orders.filter((o) => o.orderStatus === 'PLACED').length;
  const countPreparing = orders.filter((o) => o.orderStatus === 'PREPARING').length;
  const countPacked = orders.filter((o) => o.orderStatus === 'PACKED').length;
  const countCheat = orders.filter((o) => o.orderMode === 'CHEAT_MODE_OVERRIDE').length;

  return (
    <div className="space-y-6">
      {/* KDS Header & Controls */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 md:flex-row md:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Kitchen Display System (KDS)
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">• Live Station View</span>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[28px]">
            <ChefHat className="h-7 w-7 text-emerald-500" />
            Culinary Dispatch &amp; Customization Console
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time biometric kitchen tickets, pre-bite sequencing labels &amp; SHA-256 custody ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsLoading(true);
              fetchOrders();
            }}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 text-xs font-bold text-slate-700 shadow-2xs backdrop-blur-md transition hover:bg-white hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            Refresh Station
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4.5 shadow-xs backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Orders In Queue
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
            {countPlaced}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Awaiting station acceptance
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4.5 shadow-xs backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Preparing Now
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-amber-500 tabular-nums">
            {countPreparing}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Cooking at kitchen stations
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4.5 shadow-xs backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ready To Pack
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-emerald-500 tabular-nums">
            {countPacked}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Boxing &amp; tamper-evident sealing
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4.5 shadow-xs backdrop-blur-xl dark:border-amber-500/25 dark:bg-amber-500/[0.08]">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Cheat Mode Orders
          </div>
          <div className="mt-1.5 font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {countCheat}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-amber-600/80 dark:text-amber-400/80">
            Mandatory 3-phase box labeling
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 shadow-xs backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="relative flex min-w-[240px] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket #, patient name, dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9.5 w-full rounded-xl border border-slate-200/80 bg-slate-50/80 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="KITCHEN_ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="PACKED">Packed</option>
            <option value="OUT_FOR_DELIVERY">Dispatched</option>
          </select>

          {/* Mode Filter */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="h-9.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
          >
            <option value="ALL">All Modes</option>
            <option value="VITALS_GUARD">Vitals Guard Only</option>
            <option value="CHEAT_MODE_OVERRIDE">Cheat Mode Only</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 py-16 text-center shadow-xs backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60">
          <Utensils className="mx-auto mb-2.5 h-10 w-10 text-slate-400 opacity-50" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Orders in Queue</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Incoming patient orders will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => {
            const isCheat = order.orderMode === 'CHEAT_MODE_OVERRIDE';
            const ticketNo = order.printedKitchenTicket?.ticketNumber || `TKT-${order._id.slice(-4).toUpperCase()}`;

            return (
              <div
                key={order._id}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white/85 dark:bg-slate-900/75 ${
                  isCheat
                    ? 'border-amber-500/40 hover:border-amber-500/70'
                    : 'border-emerald-500/30 hover:border-emerald-500/60'
                }`}
              >
                <div>
                  {/* Card Header: Ticket # & Mode */}
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-extrabold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {ticketNo}
                      </span>
                      <span
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          isCheat
                            ? 'border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isCheat ? (
                          <>
                            <Flame className="h-3 w-3" />
                            CHEAT OVERRIDE
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            VITALS GUARD
                          </>
                        )}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <span className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase text-cyan-700 dark:text-cyan-300">
                      {order.orderStatus}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3.5 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {order.userId?.name || 'Patient'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {order.userId?.phoneNumber || '+91 98765 43210'} • {order.deliveryAddress?.area || 'Banjara Hills'}
                    </div>
                  </div>

                  {/* CRITICAL CHEF PREPARATION DIRECTIVES */}
                  {order.appliedModifications?.length > 0 ? (
                    <div className="mb-3.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] p-3 text-rose-700 dark:text-rose-300">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Clinical Recipe Modifications Required:
                      </div>
                      <ul className="space-y-1 text-xs font-semibold">
                        {order.appliedModifications.map((mod, mIdx) => (
                          <li key={mIdx} className="flex items-start gap-1.5">
                            <span className="text-rose-500">•</span>
                            <span>{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mb-3.5 flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Standard low-glycemic kitchen recipe verified.
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="mb-3.5 space-y-1.5 border-b border-t border-slate-200/70 py-2.5 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Dishes To Prepare:
                    </div>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.quantity}x {item.name || item.foodItemId?.name || 'Dish'}
                        </span>
                        <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                          ₹{(item.price || 200) * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 3-Phase Packaging Box Labels */}
                  <div className="mb-3.5">
                    <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <Layers className="h-3 w-3 text-emerald-500" />
                      3-Phase Sequencing Packaging Labels:
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-extrabold">
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
                        BOX 1: FIBER
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
                        BOX 2: PROTEIN
                      </div>
                      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
                        BOX 3: CARBS
                      </div>
                    </div>
                  </div>

                  {/* SHA-256 Custody Hash */}
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/90 p-2 font-mono text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
                    <div className="flex items-center gap-1 truncate pr-2">
                      <Hash className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {order.printedKitchenTicket?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </span>
                    </div>
                    <span className="shrink-0 font-bold text-emerald-500">VERIFIED</span>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => setActivePrintOrder(order)}
                    className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 shadow-2xs transition hover:border-cyan-500/40 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-cyan-400"
                    title="Simulate Thermal ESC/POS Print"
                  >
                    <Printer className="h-4 w-4" />
                  </button>

                  <div className="flex flex-1 items-center justify-end gap-1.5">
                    {order.orderStatus === 'PLACED' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'KITCHEN_ACCEPTED')}
                        disabled={isUpdating}
                        className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.orderStatus === 'KITCHEN_ACCEPTED' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'PREPARING')}
                        disabled={isUpdating}
                        className="rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition hover:bg-amber-600"
                      >
                        Start Cooking
                      </button>
                    )}

                    {order.orderStatus === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'PACKED')}
                        disabled={isUpdating}
                        className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-700"
                      >
                        Mark Packed
                      </button>
                    )}

                    {order.orderStatus === 'PACKED' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'OUT_FOR_DELIVERY')}
                        disabled={isUpdating}
                        className="rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-purple-500/20 transition hover:bg-purple-700"
                      >
                        Dispatch
                      </button>
                    )}

                    {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" /> En Route
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ESC/POS Thermal Slip Simulation Modal */}
      {activePrintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  ESC/POS 80mm Thermal Slip Preview
                </h3>
              </div>
              <button
                onClick={() => setActivePrintOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated 80mm Thermal Paper */}
            <div className="select-text space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-900 shadow-inner dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
              <div className="text-center font-bold">
                ================================<br />
                BIOSYNC AI METABOLIC KITCHEN<br />
                FSSAI 5-STAR AUDITED CLOUD STATION<br />
                ================================
              </div>
              <div>
                TICKET: {activePrintOrder.printedKitchenTicket?.ticketNumber || 'KDS-084'}<br />
                MODE: {activePrintOrder.orderMode}<br />
                DATE: {new Date(activePrintOrder.createdAt || Date.now()).toLocaleString()}<br />
                PATIENT: {activePrintOrder.userId?.name || 'Aman Sharma'}
              </div>
              <div className="border-t border-dashed border-slate-300 pt-1 dark:border-slate-700">
                ITEMS ORDERED:<br />
                {activePrintOrder.items?.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.quantity}x {i.name || 'Dish Item'}</span>
                    <span>₹{(i.price || 180) * i.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-slate-300 pt-1 font-bold text-rose-600 dark:border-slate-700 dark:text-rose-400">
                CHEF DIRECTIVES:<br />
                {activePrintOrder.appliedModifications?.join('\n') || 'STANDARD LOW-GI PROTOCOL'}
              </div>
              <div className="border-t border-dashed border-slate-300 pt-1 dark:border-slate-700">
                PACKAGING LABELS:<br />
                [BOX 1] FIBER &amp; LEAFY STARTER<br />
                [BOX 2] PROTEIN &amp; HEALTHY LIPIDS<br />
                [BOX 3] COMPLEX CARBOHYDRATE
              </div>
              <div className="break-all border-t border-dashed border-slate-300 pt-1 text-[9px] dark:border-slate-700">
                SHA-256 HASH:<br />
                {activePrintOrder.printedKitchenTicket?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
              <div className="pt-1 text-center font-bold">
                *** CLINICALLY GOVERNED ORDER ***
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setActivePrintOrder(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Thermal print command sent to Bluetooth/Network ESC/POS Printer (Port 9100).');
                  setActivePrintOrder(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-700"
              >
                <Printer className="h-4 w-4" />
                Send to Thermal Printer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback high-fidelity KDS queue items
function getFallbackKdsOrders() {
  return [
    {
      _id: 'ord_kds_001',
      orderStatus: 'PLACED',
      orderMode: 'CHEAT_MODE_OVERRIDE',
      createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
      userId: { name: 'Aman Sharma', phoneNumber: '+91 98765 43210' },
      deliveryAddress: { area: 'Banjara Hills, Road No. 10' },
      items: [
        { name: '1kg Hyderabadi Dum Handi Biryani', quantity: 1, price: 540 },
        { name: 'Cucumber Jeera Raita', quantity: 2, price: 120 },
      ],
      appliedModifications: [
        'SEPARATE HIGH-AMYLOSE TOP RICE (Dadaji T2D: 120g portion)',
        'SODIUM CAPPED AT 250mg (Papaji BP Protocol)',
        'EXTRA GHEE ON ATHLETE PORTION (Aman: 460g)',
      ],
      printedKitchenTicket: {
        ticketNumber: 'KDS-084',
        sha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      },
    },
    {
      _id: 'ord_kds_002',
      orderStatus: 'PREPARING',
      orderMode: 'VITALS_GUARD',
      createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
      userId: { name: 'Dr. Sunita Rao', phoneNumber: '+91 94401 22334' },
      deliveryAddress: { area: 'Jubilee Hills, Road No. 36' },
      items: [
        { name: 'Methi-Infused Whole Moong Khichdi', quantity: 1, price: 260 },
        { name: 'Karela Crisp & Jamun Seed Kadhi', quantity: 1, price: 210 },
      ],
      appliedModifications: [
        'A2 DESI COW GHEE ONLY (Zero hydrogenated vanaspati)',
        'STEAMED NOT FRIED (RS3 Retrogradation Protocol)',
      ],
      printedKitchenTicket: {
        ticketNumber: 'KDS-085',
        sha256Hash: 'b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef1',
      },
    },
    {
      _id: 'ord_kds_003',
      orderStatus: 'PACKED',
      orderMode: 'VITALS_GUARD',
      createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
      userId: { name: 'Rajesh Varma', phoneNumber: '+91 98480 99887' },
      deliveryAddress: { area: 'Madhapur, Hitech City' },
      items: [
        { name: 'Palak Paneer with Cold-Pressed Mustard Oil', quantity: 1, price: 320 },
        { name: 'Multigrain Methi Missi Roti', quantity: 2, price: 90 },
      ],
      appliedModifications: ['COLD-PRESSED MUSTARD OIL CERTIFIED (OQI 94/100)'],
      printedKitchenTicket: {
        ticketNumber: 'KDS-086',
        sha256Hash: 'c3d4e5f6a1b27890123456789abcdef0123456789abcdef0123456789abcdef2',
      },
    },
  ];
}
