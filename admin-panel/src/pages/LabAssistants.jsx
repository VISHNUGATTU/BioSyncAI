import React, { useState, useEffect } from 'react';
import {
  Edit,
  Trash2,
  UserRoundCog,
  Search,
  Plus,
  X,
  Phone,
  Car,
  Clock3,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

import api from '../api/axios';

const LabAssistants = () => {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const [newLA, setNewLA] = useState({
    name: '',
    phone: '',
    password: '',
    employeeId: '',
    gender: 'Male',
    bloodGroup: '',
    vehicleType: 'Two Wheeler',
    vehicleNumber: '',
    startShift: '09:00',
    endShift: '17:00',
  });

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/lab-assistants');

      if (res.data.success) {
        setAssistants(res.data.labAssistants);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLA = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/admin/lab-assistants', newLA);

      if (res.data.success) {
        setShowModal(false);

        setNewLA({
          name: '',
          phone: '',
          password: '',
          employeeId: '',
          gender: 'Male',
          bloodGroup: '',
          vehicleType: 'Two Wheeler',
          vehicleNumber: '',
          startShift: '09:00',
          endShift: '17:00',
        });

        fetchAssistants();
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          'Error creating Lab Assistant.'
      );
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to remove this lab assistant?'
      )
    ) {
      try {
        await api.delete(`/admin/lab-assistants/${id}`);
        fetchAssistants();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const filteredAssistants = assistants.filter((assistant) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      assistant.name?.toLowerCase().includes(query) ||
      assistant.employeeId?.toLowerCase().includes(query) ||
      assistant.phone?.toLowerCase().includes(query) ||
      assistant.vehicleNumber?.toLowerCase().includes(query)
    );
  });

  const getStatusClasses = (status) => {
    if (status === 'Available') {
      return 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400';
    }

    return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
  };

  const getInitials = (name) => {
    const parts = name?.trim()?.split(/\s+/) || [];

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return name?.slice(0, 2).toUpperCase() || 'LA';
  };

  const inputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
              Field Operations
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Lab Assistants
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Manage your laboratory field team, shifts and assigned vehicles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.7)]" />
            {assistants.length} assistants
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(14,165,233,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(14,165,233,0.25)]"
          >
            <Plus size={16} />
            Add Assistant
          </button>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Field Team
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              Active and registered laboratory assistants
            </p>
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
            />

            <input
              type="search"
              placeholder="Search assistants..."
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
                  Employee
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Contact
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Shift
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Vehicle
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
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading field team...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredAssistants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <UserRoundCog size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search
                          ? 'No matching assistants'
                          : 'No assistants found'}
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        {search
                          ? 'Try a different search term.'
                          : 'Add a lab assistant to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssistants.map((la) => (
                  <tr
                    key={la._id}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                  >
                    {/* Employee */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-[10px] font-bold text-cyan-400">
                          {getInitials(la.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {la.name}
                          </p>

                          <p className="mt-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-600">
                            {la.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone
                          size={13}
                          className="shrink-0 text-slate-400 dark:text-slate-600"
                        />

                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {la.phone || 'Not available'}
                        </span>
                      </div>
                    </td>

                    {/* Shift */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock3
                          size={13}
                          className="text-slate-400 dark:text-slate-600"
                        />

                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {la.shiftTiming?.start || '--:--'}
                          <span className="mx-1.5 text-slate-300 dark:text-slate-700">
                            →
                          </span>
                          {la.shiftTiming?.end || '--:--'}
                        </span>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Car
                          size={14}
                          className="text-slate-400 dark:text-slate-600"
                        />

                        <div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {la.vehicleType || 'Not assigned'}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                            {la.vehicleNumber || 'No vehicle number'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                          la.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                        {la.status?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit"
                          aria-label={`Edit ${la.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete ${la.name}`}
                          onClick={() => handleDelete(la._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-red-400/15 hover:bg-red-400/[0.07] hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredAssistants.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredAssistants.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {assistants.length}
              </span>{' '}
              assistants
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <ShieldCheck size={13} className="text-emerald-400" />
              Field operations secured
            </div>
          </div>
        )}
      </section>

      {/* Create assistant modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
          />

          <div className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
                  <UserRoundCog size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add Lab Assistant
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                    Create a new field team account
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Close modal"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal form */}
            <form
              onSubmit={handleCreateLA}
              className="max-h-[calc(100vh-180px)] overflow-y-auto px-5 py-5 sm:px-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newLA.name}
                    onChange={(e) =>
                      setNewLA({
                        ...newLA,
                        name: e.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={newLA.phone}
                    onChange={(e) =>
                      setNewLA({
                        ...newLA,
                        phone: e.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Employee ID
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. LA-001"
                    value={newLA.employeeId}
                    onChange={(e) =>
                      setNewLA({
                        ...newLA,
                        employeeId: e.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                {/* Password */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Temporary Password
                  </label>

                  <input
                    type="password"
                    placeholder="Create temporary password"
                    value={newLA.password}
                    onChange={(e) =>
                      setNewLA({
                        ...newLA,
                        password: e.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                {/* Vehicle type */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Vehicle Type
                  </label>

                  <div className="relative">
                    <select
                      value={newLA.vehicleType}
                      onChange={(e) =>
                        setNewLA({
                          ...newLA,
                          vehicleType: e.target.value,
                        })
                      }
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="Two Wheeler">Two Wheeler</option>
                      <option value="Four Wheeler">Four Wheeler</option>
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Vehicle number */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Vehicle Number
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. TS09AB1234"
                    value={newLA.vehicleNumber}
                    onChange={(e) =>
                      setNewLA({
                        ...newLA,
                        vehicleNumber: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Gender
                  </label>

                  <div className="relative">
                    <select
                      value={newLA.gender}
                      onChange={(e) =>
                        setNewLA({
                          ...newLA,
                          gender: e.target.value,
                        })
                      }
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Blood group */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Blood Group
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. O+"
                    value={newLA.bloodGroup}
                    onChange={(e) =>
                      setNewLA({
                        ...newLA,
                        bloodGroup: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                {/* Shift */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Shift Timing
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="time"
                        value={newLA.startShift}
                        onChange={(e) =>
                          setNewLA({
                            ...newLA,
                            startShift: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="relative">
                      <input
                        type="time"
                        value={newLA.endShift}
                        onChange={(e) =>
                          setNewLA({
                            ...newLA,
                            endShift: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200/80 pt-5 dark:border-slate-800/80 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-xs font-semibold text-white shadow-[0_7px_20px_rgba(14,165,233,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(14,165,233,0.22)]"
                >
                  Create Assistant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabAssistants;