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
} from 'lucide-react';

import api from '../api/axios';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/appointments');

      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentType = (appointment) => {
    return appointment.type || 'Consultation';
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Completed':
        return 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400';

      case 'Scheduled':
        return 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400';

      case 'Cancelled':
      case 'Canceled':
        return 'border-red-400/15 bg-red-400/[0.08] text-red-400';

      case 'Pending':
        return 'border-amber-400/15 bg-amber-400/[0.08] text-amber-400';

      default:
        return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 size={12} />;

      case 'Cancelled':
      case 'Canceled':
        return <XCircle size={12} />;

      case 'Scheduled':
        return <Clock size={12} />;

      default:
        return <Timer size={12} />;
    }
  };

  const getTypeIcon = (type) => {
    const normalized = type?.toLowerCase();

    if (
      normalized?.includes('virtual') ||
      normalized?.includes('video') ||
      normalized?.includes('online')
    ) {
      return <Video size={14} />;
    }

    if (
      normalized?.includes('inperson') ||
      normalized?.includes('in-person') ||
      normalized?.includes('clinic')
    ) {
      return <Building2 size={14} />;
    }

    return <Stethoscope size={14} />;
  };

  const getTypeClasses = (type) => {
    const normalized = type?.toLowerCase();

    if (
      normalized?.includes('virtual') ||
      normalized?.includes('video') ||
      normalized?.includes('online')
    ) {
      return 'bg-violet-400/[0.08] text-violet-400 border-violet-400/15';
    }

    if (
      normalized?.includes('inperson') ||
      normalized?.includes('in-person') ||
      normalized?.includes('clinic')
    ) {
      return 'bg-blue-400/[0.08] text-blue-400 border-blue-400/15';
    }

    return 'bg-slate-400/[0.08] text-slate-400 border-slate-400/15';
  };

  const filteredAppointments = useMemo(() => {
    const query = search.toLowerCase().trim();

    return appointments.filter((appointment) => {
      const patientName = `${appointment.user?.firstName || ''} ${
        appointment.user?.lastName || ''
      }`.trim();

      const doctorName = appointment.doctor?.name || '';
      const appointmentId = appointment._id || '';
      const appointmentType = getAppointmentType(appointment);

      const matchesSearch =
        !query ||
        patientName.toLowerCase().includes(query) ||
        doctorName.toLowerCase().includes(query) ||
        appointmentId.toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'All' ||
        appointmentType.toLowerCase() === typeFilter.toLowerCase();

      const appointmentDate = appointment.scheduledDate
        ? new Date(appointment.scheduledDate)
        : null;

      const formattedDate = appointmentDate
        ? appointmentDate.toISOString().split('T')[0]
        : '';

      const matchesDate =
        !dateFilter || formattedDate === dateFilter;

      return matchesSearch && matchesType && matchesDate;
    });
  }, [appointments, dateFilter, typeFilter, search]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      scheduled: appointments.filter(
        (appointment) => appointment.status === 'Scheduled'
      ).length,
      completed: appointments.filter(
        (appointment) => appointment.status === 'Completed'
      ).length,
      cancelled: appointments.filter(
        (appointment) =>
          appointment.status === 'Cancelled' ||
          appointment.status === 'Canceled'
      ).length,
    };
  }, [appointments]);

  const formatDateTime = (date) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return {
      date: parsedDate.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: parsedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getPatientInitials = (appointment) => {
    const first = appointment.user?.firstName?.[0] || '';
    const last = appointment.user?.lastName?.[0] || '';

    return `${first}${last}`.toUpperCase() || 'PT';
  };

  const getDoctorInitials = (name) => {
    const parts = name?.trim()?.split(/\s+/) || [];

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return name?.slice(0, 2).toUpperCase() || 'DR';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Care Coordination
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Global Appointments
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Monitor system-wide doctor consultations and appointment activity.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
          <div className="min-w-[92px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">
              Total
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-200">
              {stats.total}
            </p>
          </div>

          <div className="min-w-[92px] rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500/70">
              Scheduled
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-cyan-400">
              {stats.scheduled}
            </p>
          </div>

          <div className="min-w-[92px] rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/70">
              Completed
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-emerald-400">
              {stats.completed}
            </p>
          </div>

          <div className="min-w-[92px] rounded-xl border border-red-400/10 bg-red-400/[0.035] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-red-500/70">
              Cancelled
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-red-400">
              {stats.cancelled}
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Appointment Schedule
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                {filteredAppointments.length} appointment
                {filteredAppointments.length !== 1 ? 's' : ''} currently shown
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative sm:w-[230px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                />

                <input
                  type="search"
                  placeholder="Search patient or doctor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Date */}
              <div className="relative">
                <CalendarDays
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                />

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 sm:w-[155px]"
                />
              </div>

              {/* Type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700"
              >
                <option value="All">All Types</option>
                <option value="Virtual">Virtual Consults</option>
                <option value="InPerson">Clinic Visits</option>
              </select>

              {/* Refresh */}
              <button
                type="button"
                onClick={fetchAppointments}
                disabled={loading}
                title="Refresh appointments"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-300"
              >
                <RefreshCw
                  size={15}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Appointment
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Patient
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Doctor
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Type
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Schedule
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
                        Loading appointments...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
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
                  const dateTime = formatDateTime(apt.scheduledDate);
                  const patientName =
                    `${apt.user?.firstName || ''} ${
                      apt.user?.lastName || ''
                    }`.trim() || 'Unknown Patient';

                  const doctorName =
                    apt.doctor?.name || 'Unassigned';

                  const type = getAppointmentType(apt);

                  return (
                    <tr
                      key={apt._id}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                    >
                      {/* Appointment */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400">
                            <CalendarDays size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Consultation
                            </p>

                            <p className="mt-0.5 max-w-[170px] truncate font-mono text-[9px] text-slate-400 dark:text-slate-600">
                              {apt._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08] text-[9px] font-bold text-blue-400">
                            {getPatientInitials(apt)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {patientName}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                              Patient
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/[0.08] text-[9px] font-bold text-violet-400">
                            {getDoctorInitials(doctorName)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {doctorName}
                            </p>

                            {!apt.doctor && (
                              <p className="mt-0.5 text-[10px] text-amber-500">
                                Awaiting assignment
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-semibold ${getTypeClasses(
                            type
                          )}`}
                        >
                          {getTypeIcon(type)}
                          {type}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock
                            size={13}
                            className="shrink-0 text-slate-400 dark:text-slate-600"
                          />

                          <div>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {dateTime.date}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                              {dateTime.time}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                            apt.status
                          )}`}
                        >
                          {getStatusIcon(apt.status)}
                          {apt.status || 'Unknown'}
                        </span>
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
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredAppointments.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {appointments.length}
              </span>{' '}
              appointments
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Scheduling data synchronized
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Appointments;