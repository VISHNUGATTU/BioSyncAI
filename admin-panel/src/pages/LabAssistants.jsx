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
  Save,
} from 'lucide-react';

import api from '../api/axios';

const LabAssistants = () => {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [search, setSearch] = useState('');

  // Create state
  const [newLA, setNewLA] = useState({
    name: '',
    phone: '',
    password: '',
    employeeId: '',
    gender: 'Male',
    bloodGroup: '',
    vehicleType: 'Two-Wheeler',
    vehicleNumber: '',
    startShift: '09:00',
    endShift: '17:00',
    assignedZones: 'Madhapur, Hitech City',
  });

  // Edit state
  const [editingLA, setEditingLA] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/lab-assistants');
      if (res.data.success) {
        setAssistants(res.data.labAssistants || []);
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
        setShowCreateModal(false);
        setNewLA({
          name: '',
          phone: '',
          password: '',
          employeeId: '',
          gender: 'Male',
          bloodGroup: '',
          vehicleType: 'Two-Wheeler',
          vehicleNumber: '',
          startShift: '09:00',
          endShift: '17:00',
          assignedZones: 'Madhapur, Hitech City',
        });
        fetchAssistants();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating Lab Assistant.');
    }
  };

  const openEditModal = (assistant) => {
    setEditingLA({
      _id: assistant._id,
      name: assistant.name || '',
      phone: assistant.phone || '',
      employeeId: assistant.employeeId || '',
      gender: assistant.gender || 'Male',
      bloodGroup: assistant.bloodGroup || '',
      vehicleType: assistant.vehicleType || 'Two-Wheeler',
      vehicleNumber: assistant.vehicleNumber || '',
      status: assistant.status || 'Off_Duty',
      startShift: assistant.shiftTiming?.start || '09:00',
      endShift: assistant.shiftTiming?.end || '17:00',
      assignedZones: Array.isArray(assistant.assignedZones)
        ? assistant.assignedZones.join(', ')
        : assistant.assignedZones || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateLA = async (e) => {
    e.preventDefault();
    if (!editingLA) return;

    try {
      setSavingEdit(true);
      const payload = {
        name: editingLA.name,
        phone: editingLA.phone,
        gender: editingLA.gender,
        bloodGroup: editingLA.bloodGroup,
        vehicleType: editingLA.vehicleType,
        vehicleNumber: editingLA.vehicleNumber,
        status: editingLA.status,
        shiftTiming: {
          start: editingLA.startShift,
          end: editingLA.endShift,
        },
        assignedZones: editingLA.assignedZones,
      };

      const res = await api.put(`/admin/lab-assistants/${editingLA._id}`, payload);
      if (res.data.success) {
        setShowEditModal(false);
        fetchAssistants();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating Lab Assistant.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this lab assistant?')) {
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
    if (status === 'On_Route' || status === 'Collecting') {
      return 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400';
    }
    return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
  };

  const inputClass =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950';

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
            Manage mobile field phlebotomists, vehicle allocations, and shift schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAssistants}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Clock3 size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5"
          >
            <Plus size={15} />
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
              Field Personnel Directory
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              Active staff credentials, live status, and contact info
            </p>
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
            />
            <input
              type="search"
              placeholder="Search name, phone, vehicle..."
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
                  Assistant
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Contact
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Vehicle
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Shift & Zones
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Duty Status
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
                      <p className="text-xs font-medium text-slate-500">Loading assistants...</p>
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
                        No lab assistants found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try modifying your search query or add a new assistant.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssistants.map((assistant) => (
                  <tr
                    key={assistant._id}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                  >
                    {/* Assistant Name & Emp ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-xs font-bold text-cyan-500">
                          {assistant.name?.slice(0, 2).toUpperCase() || 'LA'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {assistant.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                            ID: {assistant.employeeId || 'LA-FIELD'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Phone size={13} className="text-slate-400" />
                        <span>{assistant.phone}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Blood: {assistant.bloodGroup || '—'}
                      </p>
                    </td>

                    {/* Vehicle */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <Car size={14} className="text-cyan-500" />
                        <span>{assistant.vehicleType || 'Two-Wheeler'}</span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-500">
                        {assistant.vehicleNumber || 'No plate registered'}
                      </p>
                    </td>

                    {/* Shift & Zones */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {assistant.shiftTiming?.start || '09:00'} - {assistant.shiftTiming?.end || '17:00'}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {Array.isArray(assistant.assignedZones) && assistant.assignedZones.length > 0 ? (
                          assistant.assignedZones.map((z, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            >
                              {z}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">Central Hub</span>
                        )}
                      </div>
                    </td>

                    {/* Duty Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                          assistant.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {assistant.status?.replace('_', ' ') || 'Off Duty'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(assistant)}
                          title="Edit Assistant"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/[0.08] hover:text-cyan-500 dark:hover:text-cyan-400"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(assistant._id)}
                          title="Delete Assistant"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-red-400/20 hover:bg-red-400/[0.08] hover:text-red-500"
                        >
                          <Trash2 size={14} />
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
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredAssistants.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{assistants.length}</span> assistants
            </p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <ShieldCheck size={13} className="text-emerald-400" />
              Field operations fleet synchronized
            </div>
          </div>
        )}
      </section>

      {/* Create Assistant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowCreateModal(false)} />

          <div className="relative z-10 w-full max-w-[540px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <UserRoundCog size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add Lab Assistant
                  </h2>
                  <p className="text-[10px] text-slate-400">Create a new field team phlebotomist</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLA} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Assistant name"
                    value={newLA.name}
                    onChange={(e) => setNewLA({ ...newLA, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91..."
                    value={newLA.phone}
                    onChange={(e) => setNewLA({ ...newLA, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Secret access password"
                    value={newLA.password}
                    onChange={(e) => setNewLA({ ...newLA, password: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LA-001"
                    value={newLA.employeeId}
                    onChange={(e) => setNewLA({ ...newLA, employeeId: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Vehicle Type
                  </label>
                  <select
                    value={newLA.vehicleType}
                    onChange={(e) => setNewLA({ ...newLA, vehicleType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="Four-Wheeler">Four-Wheeler</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Vehicle Plate
                  </label>
                  <input
                    type="text"
                    placeholder="TS09AB1234"
                    value={newLA.vehicleNumber}
                    onChange={(e) => setNewLA({ ...newLA, vehicleNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    placeholder="O+, A+..."
                    value={newLA.bloodGroup}
                    onChange={(e) => setNewLA({ ...newLA, bloodGroup: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Assigned Operating Zones (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Madhapur, Hitech City, Gachibowli"
                  value={newLA.assignedZones}
                  onChange={(e) => setNewLA({ ...newLA, assignedZones: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:from-cyan-400 hover:to-blue-500"
                >
                  Create Assistant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assistant Modal */}
      {showEditModal && editingLA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowEditModal(false)} />

          <div className="relative z-10 w-full max-w-[540px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <Edit size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Edit Lab Assistant
                  </h2>
                  <p className="text-[10px] text-slate-400">Update personnel details & availability</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateLA} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLA.name}
                    onChange={(e) => setEditingLA({ ...editingLA, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingLA.phone}
                    onChange={(e) => setEditingLA({ ...editingLA, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Duty Status
                  </label>
                  <select
                    value={editingLA.status}
                    onChange={(e) => setEditingLA({ ...editingLA, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Available">Available</option>
                    <option value="On_Route">On Route</option>
                    <option value="Collecting">Collecting</option>
                    <option value="Off_Duty">Off Duty</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={editingLA.bloodGroup}
                    onChange={(e) => setEditingLA({ ...editingLA, bloodGroup: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Vehicle Type
                  </label>
                  <select
                    value={editingLA.vehicleType}
                    onChange={(e) => setEditingLA({ ...editingLA, vehicleType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="Four-Wheeler">Four-Wheeler</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={editingLA.vehicleNumber}
                    onChange={(e) => setEditingLA({ ...editingLA, vehicleNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Assigned Operating Zones
                </label>
                <input
                  type="text"
                  value={editingLA.assignedZones}
                  onChange={(e) => setEditingLA({ ...editingLA, assignedZones: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  <Save size={14} className={savingEdit ? 'animate-spin' : ''} />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
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