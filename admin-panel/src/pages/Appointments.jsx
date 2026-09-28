import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Video,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Timer,
  UserRound,
  Stethoscope,
  RefreshCw,
  MapPin,
  UserRoundCog,
  Calendar,
  X,
  Save,
  Activity,
  Phone,
  ShieldAlert,
} from 'lucide-react';

import api from '../api/axios';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [labAssistants, setLabAssistants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modal state
  const [selectedApt, setSelectedApt] = useState(null);
  const [assignAssistantId, setAssignAssistantId] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchAssistants();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/appointments');
      if (res.data.success) {
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
      if (res.data.success) {
        setLabAssistants(res.data.labAssistants || []);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
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

      if (res.data.success) {
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

  const getAppointmentTypeLabel = (type) => {
    if (type === 'Lab_Collection') return 'Home Lab Collection';
    if (type === 'Doctor_Consultation') return 'Doctor Consultation';
    return type || 'Lab Visit';
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Completed':
        return 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400';
      case 'Assistant_Assigned':
      case 'Assigned':
      case 'Confirmed':
        return 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400';
      case 'On_The_Way':
      case 'On_Route':
      case 'Arrived':
      case 'Collecting':
      case 'Sample_Collected':
        return 'border-violet-400/15 bg-violet-400/[0.08] text-violet-400';
      case 'Cancelled':
      case 'Canceled':
      case 'Failed':
        return 'border-red-400/15 bg-red-400/[0.08] text-red-400';
      case 'Booked':
      case 'Pending':
      default:
        return 'border-amber-400/15 bg-amber-400/[0.08] text-amber-400';
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

      const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;

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
        const d = new Date(a.scheduledDate).toDateString();
        return d === new Date().toDateString();
      }).length,
      pending: appointments.filter(
        (a) => a.status === 'Booked' || a.status === 'Pending'
      ).length,
      completed: appointments.filter((a) => a.status === 'Completed').length,
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
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Operations & Logistics
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Appointments & Visits
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Dispatch lab assistants, assign medical staff, and monitor home collection schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              fetchAppointments();
              fetchAssistants();
            }}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={14} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh Schedule
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
              Total Bookings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <CalendarDays size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            All appointments in registry
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-500">
              Scheduled Today
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-cyan-500 sm:text-3xl">
            {stats.today}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            For current date execution
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">
              Awaiting Dispatch
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/[0.08] text-amber-400">
              <Timer size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-500 sm:text-3xl">
            {stats.pending}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Needs assistant assignment
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
              Completed Visits
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
            {stats.completed}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Samples collected & delivered
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Lab_Collection', 'Doctor_Consultation'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  typeFilter === type
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {type === 'All'
                  ? 'All Visits'
                  : type === 'Lab_Collection'
                  ? 'Home Collections'
                  : 'Doctor Consults'}
              </button>
            ))}

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs text-red-500 hover:underline"
              >
                Clear Date
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
            />
            <input
              type="search"
              placeholder="Search patient, assistant, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Appointment ID
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Type & Service
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Assigned Staff
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Date & Slot
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
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
                      <p className="text-xs font-medium text-slate-500">Loading appointments...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <CalendarDays size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No appointments found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try changing the search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const patientName = `${apt.user?.firstName || ''} ${apt.user?.lastName || ''}`.trim() || 'Patient';
                  const isLab = (apt.appointmentType || apt.type) === 'Lab_Collection';

                  return (
                    <tr
                      key={apt._id}
                      onClick={() => openAppointmentModal(apt)}
                      className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isLab ? 'bg-cyan-400/[0.08] text-cyan-500' : 'bg-violet-400/[0.08] text-violet-500'}`}>
                            {isLab ? <Activity size={14} /> : <Stethoscope size={14} />}
                          </div>
                          <div>
                            <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                              #{apt._id?.substring(0, 8)}
                            </span>
                            {apt.collectionOTP && (
                              <p className="text-[9px] font-bold text-cyan-600">OTP: {apt.collectionOTP}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {patientName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600">
                          {apt.user?.phoneNumber || 'No phone'}
                        </p>
                      </td>

                      {/* Type & Service */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {getAppointmentTypeLabel(apt.appointmentType || apt.type)}
                        </p>
                        {apt.testCatalog?.testName && (
                          <p className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                            {apt.testCatalog.testName}
                          </p>
                        )}
                        {apt.address?.city && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin size={10} />
                            <span>{apt.address.city}</span>
                          </div>
                        )}
                      </td>

                      {/* Assigned Staff */}
                      <td className="px-6 py-4">
                        {apt.labAssistant ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/[0.08] text-emerald-500">
                              <UserRoundCog size={13} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {apt.labAssistant.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {apt.labAssistant.phone || 'Staff'}
                              </p>
                            </div>
                          </div>
                        ) : apt.doctor ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/[0.08] text-violet-500">
                              <Stethoscope size={13} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Dr. {apt.doctor.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {apt.doctor.specialty || 'Specialist'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Date & Slot */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{formatDate(apt.scheduledDate)}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Slot: {apt.timeSlot || 'Anytime'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                            apt.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {apt.status?.replace('_', ' ') || 'Booked'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAppointmentModal(apt);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-cyan-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                        >
                          <UserRoundCog size={14} />
                        </button>
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
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredAppointments.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{appointments.length}</span> appointments
            </p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Scheduling engine online
            </div>
          </div>
        )}
      </section>

      {/* Appointment Details & Management Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedApt(null)} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Manage Appointment #{selectedApt._id?.substring(0, 8)}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {getAppointmentTypeLabel(selectedApt.appointmentType || selectedApt.type)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveChanges} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {actionSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  {actionSuccess}
                </div>
              )}

              {/* Patient & Address Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Details</span>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedApt.user?.firstName} {selectedApt.user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{selectedApt.user?.phoneNumber || 'No phone'}</p>
                  {selectedApt.collectionOTP && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      Collection OTP: {selectedApt.collectionOTP}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address & Location</span>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    {selectedApt.address?.houseNumber ? `${selectedApt.address.houseNumber}, ` : ''}
                    {selectedApt.address?.street || ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedApt.address?.landmark ? `Near ${selectedApt.address.landmark}, ` : ''}
                    {selectedApt.address?.city} {selectedApt.address?.pincode ? `- ${selectedApt.address.pincode}` : ''}
                  </p>
                </div>
              </div>

              {/* Management Controls */}
              <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/30">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Operational Controls
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Status */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Update Status
                    </label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none transition-all dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="Booked">Booked</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Assistant_Assigned">Assistant Assigned</option>
                      <option value="On_Route">On Route</option>
                      <option value="Arrived">Arrived</option>
                      <option value="Collecting">Collecting</option>
                      <option value="Sample_Collected">Sample Collected</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Assign Assistant */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assign Lab Assistant
                    </label>
                    <select
                      value={assignAssistantId}
                      onChange={(e) => setAssignAssistantId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none transition-all dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="">-- Select Lab Assistant --</option>
                      {labAssistants.map((la) => (
                        <option key={la._id} value={la._id}>
                          {la.name} ({la.status}) {la.vehicleType ? `- ${la.vehicleType}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reschedule Date & TimeSlot */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Time Slot
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 08:00 AM - 09:00 AM"
                      value={rescheduleTimeSlot}
                      onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Cancellation Reason if Cancelled */}
                {updateStatus === 'Cancelled' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-red-500">
                      Cancellation Reason
                    </label>
                    <input
                      type="text"
                      placeholder="State reason for cancelling appointment"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full rounded-xl border border-red-200 bg-red-50/30 px-3 py-2 text-xs font-medium text-red-700 outline-none dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Log Notes / Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="Optional administrative note..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Tracking Logs Timeline */}
              {selectedApt.trackingLogs && selectedApt.trackingLogs.length > 0 && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/30">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Activity & Audit Timeline
                  </h4>
                  <div className="space-y-2">
                    {selectedApt.trackingLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {log.status}:
                          </span>{' '}
                          <span className="text-slate-500">{log.notes || 'Status updated'}</span>{' '}
                          <span className="text-[10px] text-slate-400">
                            ({new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApt(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChanges}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  <Save size={14} className={savingChanges ? 'animate-spin' : ''} />
                  <span>{savingChanges ? 'Saving...' : 'Apply Changes'}</span>
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