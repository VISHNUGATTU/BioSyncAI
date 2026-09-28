import React, { useState, useEffect } from 'react';
import {
  Edit,
  ShieldCheck,
  Search,
  Stethoscope,
  Star,
  UserCheck,
  ArrowUpRight,
  Plus,
  X,
  RefreshCw,
  Phone,
  Mail,
  CheckCircle2,
  Save,
} from 'lucide-react';

import api from '../api/axios';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // New Doctor Form
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: 'General Medicine',
    email: '',
    phone: '',
    rating: 4.9,
    status: 'Active',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/doctors');

      if (res.data.success) {
        setDoctors(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.post('/admin/doctors', newDoctor);

      if (res.data.success) {
        setShowCreateModal(false);
        setNewDoctor({
          name: '',
          specialty: 'General Medicine',
          email: '',
          phone: '',
          rating: 4.9,
          status: 'Active',
        });
        fetchDoctors();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating doctor');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (doc) => {
    setEditingDoc({
      _id: doc._id,
      name: doc.name || '',
      specialty: doc.specialty || '',
      email: doc.email || '',
      phone: doc.phone || '',
      rating: doc.rating || 4.8,
      status: doc.status || 'Active',
    });
    setShowEditModal(true);
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      setSaving(true);
      const res = await api.put(`/admin/doctors/${editingDoc._id}`, editingDoc);

      if (res.data.success) {
        setShowEditModal(false);
        fetchDoctors();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating doctor');
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;

    return (
      doctor.name?.toLowerCase().includes(query) ||
      doctor.specialty?.toLowerCase().includes(query) ||
      doctor.email?.toLowerCase().includes(query) ||
      doctor._id?.toLowerCase().includes(query)
    );
  });

  const getStatusClasses = (status) => {
    if (status === 'Active') {
      return 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400';
    }
    return 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400';
  };

  const getInitials = (name) => {
    const parts = name?.trim()?.split(/\s+/) || [];
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name?.slice(0, 2).toUpperCase() || 'DR';
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
              Clinical Network
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Doctor Management
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Manage verified specialists and their consultation availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDoctors}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5"
          >
            <Plus size={15} />
            Onboard Doctor
          </button>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Verified Specialists
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              Clinical professionals registered with BioSync
            </p>
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
            />
            <input
              type="search"
              placeholder="Search name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Doctor
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Specialty
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Contact
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Rating
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
                      <p className="text-xs font-medium text-slate-500">Loading specialists...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <Stethoscope size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No specialists found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try modifying search or onboard a new doctor.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr
                    key={doc._id}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                  >
                    {/* Doctor Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          {getInitials(doc.name)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            Dr. {doc.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            #{doc._id?.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                        {doc.specialty}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Mail size={12} className="text-slate-400" />
                          <span>{doc.email}</span>
                        </div>
                        {doc.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Phone size={11} className="text-slate-400" />
                            <span>{doc.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{doc.rating || 4.8}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                          doc.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {doc.status || 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          title="Edit Specialist"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/[0.08] hover:text-cyan-500"
                        >
                          <Edit size={14} />
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
        {!loading && filteredDoctors.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredDoctors.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{doctors.length}</span> specialists
            </p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Specialist directory verified
            </div>
          </div>
        )}
      </section>

      {/* Onboard Doctor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowCreateModal(false)} />

          <div className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Onboard Specialist
                  </h2>
                  <p className="text-[10px] text-slate-400">Add medical practitioner to clinical network</p>
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

            <form onSubmit={handleCreateDoctor} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Doctor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Specialty
                  </label>
                  <select
                    value={newDoctor.specialty}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                    className={inputClass}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Nutrition & Dietetics">Nutrition & Dietetics</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </label>
                  <select
                    value={newDoctor.status}
                    onChange={(e) => setNewDoctor({ ...newDoctor, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.com"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
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
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Specialist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && editingDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowEditModal(false)} />

          <div className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <Edit size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Edit Specialist
                  </h2>
                  <p className="text-[10px] text-slate-400">Update doctor credentials and status</p>
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

            <form onSubmit={handleUpdateDoctor} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editingDoc.name}
                  onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Specialty
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDoc.specialty}
                    onChange={(e) => setEditingDoc({ ...editingDoc, specialty: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </label>
                  <select
                    value={editingDoc.status}
                    onChange={(e) => setEditingDoc({ ...editingDoc, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingDoc.phone}
                    onChange={(e) => setEditingDoc({ ...editingDoc, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingDoc.rating}
                    onChange={(e) => setEditingDoc({ ...editingDoc, rating: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
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
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  <Save size={14} className={saving ? 'animate-spin' : ''} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;