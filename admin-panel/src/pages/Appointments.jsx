import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  Search,
  CheckCircle2,
  RefreshCw,
  UserRoundCog,
  Calendar,
  X,
  Save,
  Zap,
  Download,
  CheckSquare,
  Square,
  AlertCircle,
  Truck,
  Check,
  FileText,
  ExternalLink,
} from 'lucide-react';

import api, { getCertificateViewUrl } from '../api/axios';

export const Appointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [appointments, setAppointments] = useState([]);
  const [labAssistants, setLabAssistants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [autoDispatchingId, setAutoDispatchingId] = useState(null);

  // Modal State
  const [selectedApt, setSelectedApt] = useState(null);
  const [assignAssistantId, setAssignAssistantId] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Nearby Staff State inside Modal
  const [nearbyStaff, setNearbyStaff] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchAssistants();
  }, []);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatusFilter(s);
  }, [searchParams]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/appointments');
      if (res.data?.success) {
        setAppointments(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistants = async () => {
    try {
      const res = await api.get('/admin/lab-assistants');
      if (res.data?.success) {
        setLabAssistants(res.data.labAssistants || []);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
    }
  };

  const fetchNearbyStaff = async (aptId) => {
    try {
      setLoadingNearby(true);
      const res = await api.get(`/admin/appointments/${aptId}/nearby-staff`);
      if (res.data?.success) {
        setNearbyStaff(res.data.rankedLabAssistants || []);
      }
    } catch (err) {
      console.warn('Nearby staff lookup not available for this appointment coordinates');
      setNearbyStaff([]);
    } finally {
      setLoadingNearby(false);
    }
  };

  const openAppointmentModal = (apt) => {
    setSelectedApt(apt);
    setAssignAssistantId(apt.labAssistant?._id || apt.labAssistant || '');
    setUpdateStatus(apt.status || 'Booked');
    setRescheduleDate(apt.scheduledDate ? new Date(apt.scheduledDate).toISOString().split('T')[0] : '');
    setRescheduleTimeSlot(apt.timeSlot || '');
    setCancelReason(apt.cancellationReason || '');
    setAdminNotes('');
    setActionSuccess('');

    fetchNearbyStaff(apt._id);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedApt) return;

    try {
      setSavingChanges(true);
      setActionSuccess('');

      const payload = {
        status: updateStatus,
        labAssistant: assignAssistantId || null,
        scheduledDate: rescheduleDate || undefined,
        timeSlot: rescheduleTimeSlot || undefined,
        cancellationReason: updateStatus === 'Cancelled' ? cancelReason : undefined,
        notes: adminNotes || undefined,
      };

      const res = await api.put(`/admin/appointments/${selectedApt._id}`, payload);

      if (res.data?.success) {
        const updated = res.data.data;
        setSelectedApt(updated);
        setAppointments((prev) =>
          prev.map((a) => (a._id === updated._id ? updated : a))
        );
        setActionSuccess('Appointment updated successfully');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert(err.response?.data?.message || 'Failed to update appointment');
    } finally {
      setSavingChanges(false);
    }
  };

  // 1-Click Smart Auto-Dispatch
  const handleAutoDispatch = async (aptId, e) => {
    if (e) e.stopPropagation();
    try {
      setAutoDispatchingId(aptId);
      const res = await api.post(`/admin/appointments/${aptId}/auto-assign`);
      if (res.data?.success) {
        await fetchAppointments();
        if (selectedApt && selectedApt._id === aptId) {
          setSelectedApt((prev) => ({
            ...prev,
            status: 'Assistant_Assigned',
            labAssistant: res.data.data?.assignedAssistant || prev.labAssistant,
          }));
        }
        alert(res.data.message || 'Phlebotomist dispatched successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to auto-dispatch phlebotomist.');
    } finally {
      setAutoDispatchingId(null);
    }
  };

  // Batch Auto-Dispatch Selected
  const handleBatchAutoDispatch = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBatchActionLoading(true);
      const unassignedToDispatch = appointments.filter(
        (a) => selectedIds.has(a._id) && !a.labAssistant && a.status !== 'Completed' && a.status !== 'Cancelled'
      );

      if (unassignedToDispatch.length === 0) {
        alert('None of the selected appointments are eligible for auto-dispatch.');
        return;
      }

      let successCount = 0;
      for (const apt of unassignedToDispatch) {
        try {
          const res = await api.post(`/admin/appointments/${apt._id}/auto-assign`);
          if (res.data?.success) successCount++;
        } catch (err) {
          console.warn(`Auto-dispatch failed for ${apt._id}`);
        }
      }

      await fetchAppointments();
      setSelectedIds(new Set());
      alert(`Auto-dispatched ${successCount} of ${unassignedToDispatch.length} appointments successfully.`);
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Batch Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.size > 0
      ? appointments.filter((a) => selectedIds.has(a._id))
      : filteredAppointments;

    if (listToExport.length === 0) {
      alert('No appointments to export.');
      return;
    }

    const headers = ['ID', 'Patient Name', 'Phone', 'Type', 'Status', 'Date', 'Time Slot', 'Assigned Staff', 'City'];
    const rows = listToExport.map((a) => [
      a._id,
      `"${a.user?.firstName || ''} ${a.user?.lastName || ''}"`,
      a.user?.phoneNumber || a.address?.phone || '',
      a.appointmentType || 'Lab_Collection',
      a.status,
      a.scheduledDate ? new Date(a.scheduledDate).toISOString().split('T')[0] : '',
      `"${a.timeSlot || ''}"`,
      `"${a.labAssistant?.name || a.doctor?.name || 'Unassigned'}"`,
      `"${a.address?.city || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BioSync_Appointments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAppointments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAppointments.map((a) => a._id)));
    }
  };

  const toggleSelectOne = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 8 Canonical Lifecycle Stages for Filtering
  const filterStages = [
    { id: 'All', label: 'All Stages' },
    { id: 'Pending', label: '1. Booked' },
    { id: 'Assigned', label: '2. Assigned' },
    { id: 'On_The_Way', label: '3. En Route' },
    { id: 'Arrived', label: '4. Arrived' },
    { id: 'Collecting', label: '5. Collecting' },
    { id: 'Sample_Collected', label: '6. Secured' },
    { id: 'At_Laboratory', label: '7. At Lab' },
    { id: 'Completed', label: '8. Complete' },
    { id: 'Cancelled', label: 'Cancelled' },
  ];

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Completed':
      case 'Report_Generated':
        return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600';
      case 'At_Laboratory':
      case 'Processing':
        return 'border-violet-500/25 bg-violet-500/10 text-violet-600';
      case 'Sample_Collected':
        return 'border-teal-500/25 bg-teal-500/10 text-teal-600';
      case 'Collecting':
        return 'border-purple-500/25 bg-purple-500/10 text-purple-600';
      case 'Arrived':
        return 'border-indigo-500/25 bg-indigo-500/10 text-indigo-600';
      case 'On_The_Way':
      case 'On_Route':
        return 'border-blue-500/25 bg-blue-500/10 text-blue-600';
      case 'Assistant_Assigned':
      case 'Assigned':
      case 'Confirmed':
        return 'border-cyan-500/25 bg-cyan-500/10 text-cyan-600';
      case 'Cancelled':
      case 'Canceled':
      case 'Failed':
      case 'No_Show':
      case 'Rejected':
        return 'border-red-500/25 bg-red-500/10 text-red-600';
      case 'Booked':
      case 'Pending':
      default:
        return 'border-amber-500/25 bg-amber-500/10 text-amber-600';
    }
  };

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((apt) => {
      const patientName = `${apt.user?.firstName || ''} ${apt.user?.lastName || ''}`.trim();
      const assistantName = apt.labAssistant?.name || '';
      const doctorName = apt.doctor?.name || '';
      const testName = apt.testCatalog?.testName || '';
      const city = apt.address?.city || '';

      const matchesSearch =
        !query ||
        apt._id?.toLowerCase().includes(query) ||
        patientName.toLowerCase().includes(query) ||
        assistantName.toLowerCase().includes(query) ||
        doctorName.toLowerCase().includes(query) ||
        testName.toLowerCase().includes(query) ||
        city.toLowerCase().includes(query);

      const aptType = apt.appointmentType || apt.type;
      const matchesType =
        typeFilter === 'All' ||
        aptType === typeFilter ||
        (typeFilter === 'Lab' && aptType === 'Lab_Collection') ||
        (typeFilter === 'Doctor' && aptType === 'Doctor_Consultation');

      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending' || statusFilter === 'Booked') {
          matchesStatus = apt.status === 'Pending' || apt.status === 'Booked';
        } else if (statusFilter === 'Assigned' || statusFilter === 'Assistant_Assigned') {
          matchesStatus = apt.status === 'Assigned' || apt.status === 'Assistant_Assigned';
        } else if (statusFilter === 'On_The_Way' || statusFilter === 'On_Route') {
          matchesStatus = apt.status === 'On_The_Way' || apt.status === 'On_Route';
        } else if (statusFilter === 'At_Laboratory' || statusFilter === 'Processing') {
          matchesStatus = apt.status === 'At_Laboratory' || apt.status === 'Processing';
        } else if (statusFilter === 'Completed' || statusFilter === 'Report_Generated') {
          matchesStatus = apt.status === 'Completed' || apt.status === 'Report_Generated';
        } else {
          matchesStatus = apt.status === statusFilter;
        }
      }

      let matchesDate = true;
      if (dateFilter && apt.scheduledDate) {
        const aptDateStr = new Date(apt.scheduledDate).toISOString().split('T')[0];
        matchesDate = aptDateStr === dateFilter;
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [appointments, search, typeFilter, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      today: appointments.filter((a) => {
        if (!a.scheduledDate) return false;
        return new Date(a.scheduledDate).toDateString() === new Date().toDateString();
      }).length,
      pending: appointments.filter((a) => a.status === 'Booked' || a.status === 'Pending').length,
      completed: appointments.filter((a) => a.status === 'Completed' || a.status === 'Report_Generated').length,
      inTransit: appointments.filter((a) => ['Assistant_Assigned', 'On_The_Way', 'Arrived', 'Collecting'].includes(a.status)).length,
    };
  }, [appointments]);

  const formatDate = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* HEADER: Title & Actions                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              Operations & Fleet Dispatch
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Appointments & Field Visits Queue
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Intelligent staff dispatch, strict 8-stage state machine tracking, and home collection operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchAppointments();
              fetchAssistants();
            }}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-cyan-500' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. OPERATIONS KPI SUMMARY                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/65 bg-white/45 p-4 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-[11px] text-slate-400">Registry visits</p>
        </div>

        <div className="rounded-2xl border border-white/65 bg-white/45 p-4 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">Today's Schedule</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.today}</p>
          <p className="mt-1 text-[11px] text-slate-400">Scheduled collections</p>
        </div>

        <div className="rounded-2xl border border-white/65 bg-white/45 p-4 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Needs Dispatch</span>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{stats.pending}</p>
          <p className="mt-1 text-[11px] text-slate-400">Pending phlebotomist</p>
        </div>

        <div className="rounded-2xl border border-white/65 bg-white/45 p-4 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Active in Field</span>
          <p className="mt-2 text-2xl font-extrabold text-blue-600">{stats.inTransit}</p>
          <p className="mt-1 text-[11px] text-slate-400">En route / collecting</p>
        </div>

        <div className="rounded-2xl border border-white/65 bg-white/45 p-4 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{stats.completed}</p>
          <p className="mt-1 text-[11px] text-slate-400">Report generated</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. 8-STAGE FILTER STRIP                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterStages.map((stage) => {
          const isActive = statusFilter === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                setStatusFilter(stage.id);
                if (stage.id === 'All') searchParams.delete('status');
                else searchParams.set('status', stage.id);
                setSearchParams(searchParams);
              }}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-white/60 bg-white/50 text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              {stage.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BATCH OPERATIONS TOOLBAR (Shows when rows are checked)     */}
      {/* ------------------------------------------------------------- */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/90 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-600 text-xs font-bold text-white">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-cyan-900">
              Appointments Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchAutoDispatch}
              disabled={batchActionLoading}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-cyan-700 active:scale-95 disabled:opacity-50"
            >
              <Zap size={13} />
              <span>{batchActionLoading ? 'Dispatching...' : 'Auto-Dispatch Selected'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg border border-cyan-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN APPOINTMENTS TABLE                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-2xl border border-white/65 bg-white/45 shadow-sm backdrop-blur-xl">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Lab_Collection', 'Doctor_Consultation'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                  typeFilter === type
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {type === 'All'
                  ? 'All Services'
                  : type === 'Lab_Collection'
                  ? 'Home Collections'
                  : 'Doctor Consultations'}
              </button>
            ))}

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs text-red-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-[260px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search patient, staff, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-400">
                <th className="w-10 px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredAppointments.length ? (
                      <CheckSquare size={16} className="text-cyan-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider">
                  Patient & Location
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider">
                  Test Package
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider">
                  Assigned Staff
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider">
                  Scheduled Slot
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider">
                  Lifecycle Stage
                </th>
                <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" />
                      <p className="text-xs font-medium text-slate-500">Loading collection appointments...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <CalendarDays size={24} className="text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No appointments found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or changing search keywords.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const patientName = `${apt.user?.firstName || ''} ${apt.user?.lastName || ''}`.trim() || 'Patient';
                  const isSelected = selectedIds.has(apt._id);
                  const isUnassigned = !apt.labAssistant && apt.status !== 'Completed' && apt.status !== 'Cancelled';

                  return (
                    <tr
                      key={apt._id}
                      onClick={() => openAppointmentModal(apt)}
                      className={`group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-white/80 ${
                        isSelected ? 'bg-cyan-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-3 text-center" onClick={(e) => toggleSelectOne(apt._id, e)}>
                        {isSelected ? (
                          <CheckSquare size={16} className="text-cyan-600 inline" />
                        ) : (
                          <Square size={16} className="text-slate-300 hover:text-slate-500 inline" />
                        )}
                      </td>

                      {/* Patient & Location */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100/60 font-bold text-cyan-700 text-xs shrink-0">
                            {(apt.user?.firstName?.[0] || 'P').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                              {patientName}
                            </p>
                            <p className="truncate text-[10.5px] text-slate-400">
                              {apt.address?.city || apt.address?.street || 'Hyderabad'} · {apt.user?.phoneNumber || apt.phone || 'Phone on file'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Test Package */}
                      <td className="px-4 py-3">
                        <p className="truncate text-xs font-semibold text-slate-800 max-w-[200px]">
                          {apt.testCatalog?.testName || 'BioSync 360 Full Biomarker Diagnostic'}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {apt.appointmentType === 'Doctor_Consultation' ? 'Teleconsult' : 'Specimen Draw'}
                        </span>
                      </td>

                      {/* Assigned Staff */}
                      <td className="px-4 py-3">
                        {apt.labAssistant ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
                              <Truck size={12} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {apt.labAssistant.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {apt.labAssistant.phone || 'Phlebotomist'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200/50">
                            <AlertCircle size={10} />
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Scheduled Slot */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{formatDate(apt.scheduledDate)}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {apt.timeSlot || '09:00 - 10:00 AM'}
                        </p>
                      </td>

                      {/* Lifecycle Stage */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider ${getStatusClasses(
                            apt.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {apt.status?.replace(/_/g, ' ') || 'Booked'}
                        </span>
                        {apt.failureReason && (
                          <p className="mt-1 text-[10px] text-red-500 font-semibold truncate max-w-[140px]" title={apt.failureReason}>
                            ⚠️ {apt.failureReason}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isUnassigned && (
                            <button
                              type="button"
                              onClick={(e) => handleAutoDispatch(apt._id, e)}
                              disabled={autoDispatchingId === apt._id}
                              title="1-Click Auto-Dispatch Closest Phlebotomist"
                              className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700 border border-cyan-200 hover:bg-cyan-100 active:scale-95 disabled:opacity-50"
                            >
                              <Zap size={11} className={autoDispatchingId === apt._id ? 'animate-spin' : ''} />
                              <span>{autoDispatchingId === apt._id ? 'Dispatching...' : 'Dispatch'}</span>
                            </button>
                          )}

                          {['Completed', 'Report_Generated', 'Delivered'].includes(apt.status) && (
                            <a
                              href={getCertificateViewUrl(apt._id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Preview Official NABL Diagnostic Certificate"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-400 active:scale-95 transition-all"
                            >
                              <FileText size={13} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAppointmentModal(apt);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-cyan-400 hover:text-cyan-600"
                          >
                            <UserRoundCog size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredAppointments.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-medium text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredAppointments.length}</span> of{' '}
              <span className="font-bold text-slate-800">{appointments.length}</span> visits
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              BioSync AI Dispatch Engine Online
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. APPOINTMENT MANAGEMENT & DISPATCH MODAL                    */}
      {/* ------------------------------------------------------------- */}
      {selectedApt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedApt(null)} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Manage Field Appointment
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID: {selectedApt._id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveChanges} className="flex-1 overflow-y-auto p-6 space-y-5">
              {actionSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={16} />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Patient Info Card */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedApt.user?.firstName} {selectedApt.user?.lastName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedApt.user?.phoneNumber || selectedApt.phone || 'Phone on file'} · {selectedApt.address?.city || 'Hyderabad'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {typeof selectedApt.address === 'string' ? selectedApt.address : `${selectedApt.address?.street || ''} ${selectedApt.address?.city || ''} ${selectedApt.address?.pincode || ''}`}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(selectedApt.status)}`}>
                    {selectedApt.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* 1-Click Auto Dispatch Action */}
              <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                    <Zap size={13} className="text-cyan-600" />
                    Automated GPS Phlebotomist Dispatch
                  </h4>
                  <p className="text-[11px] text-cyan-700 mt-0.5">
                    Calculates geographical proximity and automatically routes the closest available staff.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAutoDispatch(selectedApt._id)}
                  disabled={autoDispatchingId === selectedApt._id}
                  className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-cyan-700 active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {autoDispatchingId === selectedApt._id ? 'Routing...' : 'Auto-Dispatch'}
                </button>
              </div>

              {/* Nearest Ranked Staff Proximity Feed */}
              {loadingNearby ? (
                <div className="text-center py-2 text-xs text-slate-400">
                  Scanning nearby phlebotomists via GPS...
                </div>
              ) : nearbyStaff.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nearest Phlebotomists By Distance
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {nearbyStaff.slice(0, 4).map((staff, idx) => (
                      <div
                        key={staff._id || idx}
                        onClick={() => setAssignAssistantId(staff._id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          assignAssistantId === staff._id
                            ? 'border-cyan-500 bg-cyan-50/80 font-bold text-cyan-900'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{staff.name}</p>
                          <p className="text-[10px] text-slate-400">{staff.distanceKm ? `${staff.distanceKm.toFixed(1)} km away` : 'Active in zone'}</p>
                        </div>
                        {assignAssistantId === staff._id && (
                          <Check size={14} className="text-cyan-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Status & Manual Assignment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Update Lifecycle Stage
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white"
                  >
                    <option value="Booked">Booked (Pending)</option>
                    <option value="Assistant_Assigned">Assistant Assigned</option>
                    <option value="On_The_Way">On The Way (En Route)</option>
                    <option value="Arrived">Arrived at Patient</option>
                    <option value="Collecting">Collecting Specimen</option>
                    <option value="Sample_Collected">Sample Secured</option>
                    <option value="At_Laboratory">At Central Laboratory</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Assign Lab Assistant
                  </label>
                  <select
                    value={assignAssistantId}
                    onChange={(e) => setAssignAssistantId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {labAssistants.map((la) => (
                      <option key={la._id} value={la._id}>
                        {la.name} ({la.status || 'Active'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reschedule Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Reschedule Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Reschedule Time Slot
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 - 11:00 AM"
                    value={rescheduleTimeSlot}
                    onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                {selectedApt && ['Completed', 'Report_Generated', 'Delivered'].includes(selectedApt.status) && (
                  <a
                    href={getCertificateViewUrl(selectedApt._id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95"
                  >
                    <ExternalLink size={13} />
                    <span>Preview Public Certificate ↗</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedApt(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChanges}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cyan-700 active:scale-95 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{savingChanges ? 'Saving Changes...' : 'Save Updates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;