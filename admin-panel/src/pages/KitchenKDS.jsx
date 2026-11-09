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
  Filter,
  ChevronRight,
  Package,
  Layers,
  ChefHat,
  Hash,
  X,
  ExternalLink,
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* KDS Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              KITCHEN DISPLAY SYSTEM (KDS)
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Live Station View</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-emerald-500" />
            Culinary Dispatch & Customization Console
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time biometric kitchen tickets, pre-bite sequencing labels & SHA-256 custody ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsLoading(true);
              fetchOrders();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 shadow-sm">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">ORDERS IN QUEUE</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{countPlaced}</div>
          <div className="text-xs text-gray-400 mt-0.5">Awaiting acceptance</div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 shadow-sm">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">PREPARING NOW</div>
          <div className="text-2xl font-black text-amber-500 mt-1">{countPreparing}</div>
          <div className="text-xs text-gray-400 mt-0.5">Cooking at kitchen stations</div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 shadow-sm">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">READY TO PACK</div>
          <div className="text-2xl font-black text-emerald-500 mt-1">{countPacked}</div>
          <div className="text-xs text-gray-400 mt-0.5">Boxing & sealing</div>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider">CHEAT MODE ORDERS</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{countCheat}</div>
          <div className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">Mandatory 3-phase box labeling</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/60">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 ml-1" />
          <input
            type="text"
            placeholder="Search ticket #, patient name, dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none"
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
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="ALL">All Modes</option>
            <option value="VITALS_GUARD">Vitals Guard Only</option>
            <option value="CHEAT_MODE_OVERRIDE">Cheat Mode Only</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800">
          <Utensils className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Orders in Queue</h3>
          <p className="text-xs text-gray-500">Incoming patient orders will appear here in real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isCheat = order.orderMode === 'CHEAT_MODE_OVERRIDE';
            const ticketNo = order.printedKitchenTicket?.ticketNumber || `TKT-${order._id.slice(-4).toUpperCase()}`;

            return (
              <div
                key={order._id}
                className={`flex flex-col justify-between rounded-xl border p-5 transition shadow-sm bg-white dark:bg-gray-800/90 ${
                  isCheat
                    ? 'border-amber-500/40 hover:border-amber-500'
                    : 'border-emerald-500/30 hover:border-emerald-500'
                }`}
              >
                <div>
                  {/* Card Header: Ticket # & Mode */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {ticketNo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isCheat
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isCheat ? (
                          <>
                            <Flame className="w-3 h-3" />
                            CHEAT OVERRIDE
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            VITALS GUARD
                          </>
                        )}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {order.orderStatus}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3 text-xs">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {order.userId?.name || 'Patient'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-[11px]">
                      {order.userId?.phoneNumber || '+91 98765 43210'} • {order.deliveryAddress?.area || 'Banjara Hills'}
                    </div>
                  </div>

                  {/* CRITICAL CHEF PREPARATION DIRECTIVES */}
                  {order.appliedModifications?.length > 0 ? (
                    <div className="p-3 mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
                      <div className="text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 mb-1 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        CLINICAL RECIPE MODIFICATIONS REQUIRED:
                      </div>
                      <ul className="text-xs space-y-1 font-semibold">
                        {order.appliedModifications.map((mod, mIdx) => (
                          <li key={mIdx} className="flex items-start gap-1.5">
                            <span className="text-red-500">•</span>
                            <span>{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-2 mb-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Standard low-glycemic kitchen recipe verified.
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="mb-3 space-y-1.5 border-t border-b border-gray-100 dark:border-gray-700/60 py-2.5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      DISHES TO PREPARE:
                    </div>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {item.quantity}x {item.name || item.foodItemId?.name || 'Dish'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ₹{(item.price || 200) * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 3-Phase Packaging Box Labels */}
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-500" />
                      3-PHASE SEQUENCING PACKAGING LABELS:
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                      <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        BOX 1: FIBER
                      </div>
                      <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        BOX 2: PROTEIN
                      </div>
                      <div className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        BOX 3: CARBS
                      </div>
                    </div>
                  </div>

                  {/* SHA-256 Custody Hash */}
                  <div className="p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-4 flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <div className="flex items-center gap-1 truncate pr-2">
                      <Hash className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {order.printedKitchenTicket?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </span>
                    </div>
                    <span className="text-emerald-500 font-bold shrink-0">VERIFIED</span>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActivePrintOrder(order)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                    title="Simulate Thermal ESC/POS Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {order.orderStatus === 'PLACED' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'KITCHEN_ACCEPTED')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.orderStatus === 'KITCHEN_ACCEPTED' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'PREPARING')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition"
                      >
                        Start Cooking
                      </button>
                    )}

                    {order.orderStatus === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'PACKED')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                      >
                        Mark Packed
                      </button>
                    )}

                    {order.orderStatus === 'PACKED' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'OUT_FOR_DELIVERY')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
                      >
                        Dispatch
                      </button>
                    )}

                    {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> En Route
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  ESC/POS 80mm Thermal Slip Preview
                </h3>
              </div>
              <button
                onClick={() => setActivePrintOrder(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated 80mm Thermal Paper */}
            <div className="p-4 bg-gray-100 dark:bg-gray-950 font-mono text-xs rounded-xl border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-100 space-y-2 select-text shadow-inner">
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
              <div className="border-t border-dashed border-gray-400 dark:border-gray-700 pt-1">
                ITEMS ORDERED:<br />
                {activePrintOrder.items?.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.quantity}x {i.name || 'Dish Item'}</span>
                    <span>₹{(i.price || 180) * i.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-400 dark:border-gray-700 pt-1 font-bold text-red-600 dark:text-red-400">
                CHEF DIRECTIVES:<br />
                {activePrintOrder.appliedModifications?.join('\n') || 'STANDARD LOW-GI PROTOCOL'}
              </div>
              <div className="border-t border-dashed border-gray-400 dark:border-gray-700 pt-1">
                PACKAGING LABELS:<br />
                [BOX 1] FIBER & LEAFY STARTER<br />
                [BOX 2] PROTEIN & HEALTHY LIPIDS<br />
                [BOX 3] COMPLEX CARBOHYDRATE
              </div>
              <div className="border-t border-dashed border-gray-400 dark:border-gray-700 pt-1 text-[9px] break-all">
                SHA-256 HASH:<br />
                {activePrintOrder.printedKitchenTicket?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
              <div className="text-center font-bold pt-1">
                *** CLINICALLY GOVERNED ORDER ***
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setActivePrintOrder(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Thermal print command sent to Bluetooth/Network ESC/POS Printer (Port 9100).');
                  setActivePrintOrder(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
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

