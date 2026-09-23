import React, { useState, useEffect } from 'react';
import {
  Edit,
  ShieldCheck,
  Search,
  Stethoscope,
  Star,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react';

import api from '../api/axios';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/doctors');

      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      doctor.name?.toLowerCase().includes(query) ||
      doctor.specialty?.toLowerCase().includes(query) ||
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
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500 sm:flex">
            <UserCheck size={14} className="text-emerald-400" />
            {doctors.length} specialists
          </div>

          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(14,165,233,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(14,165,233,0.25)]"
          >
            <Stethoscope size={15} />
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
                  <td colSpan="5" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400 dark:border-slate-700 dark:border-t-cyan-400" />

                      <p className="text-xs font-medium text-slate-500">
                        Loading doctors...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <Stethoscope size={18} />
                      </div>

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {search
                          ? 'No matching doctors'
                          : 'No doctors found'}
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        {search
                          ? 'Try a different name or specialty.'
                          : 'No specialists are currently registered.'}
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
                    {/* Doctor */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-[10px] font-bold text-cyan-400">
                          {getInitials(doc.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {doc.name}
                          </p>

                          <p className="mt-0.5 max-w-[220px] truncate font-mono text-[9px] text-slate-400 dark:text-slate-600">
                            {doc._id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Stethoscope
                          size={13}
                          className="text-slate-400 dark:text-slate-600"
                        />

                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {doc.specialty || 'General'}
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Star
                          size={13}
                          fill="currentColor"
                          className="text-amber-400"
                        />

                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {doc.rating || 0}
                        </span>

                        <span className="text-[10px] text-slate-400 dark:text-slate-600">
                          / 5
                        </span>
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
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Verify Documents"
                          aria-label={`Verify documents for ${doc.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-emerald-400/15 hover:bg-emerald-400/[0.07] hover:text-emerald-400 dark:text-slate-600 dark:hover:text-emerald-400"
                        >
                          <ShieldCheck size={15} />
                        </button>

                        <button
                          type="button"
                          title="Edit"
                          aria-label={`Edit ${doc.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          title="Open profile"
                          aria-label={`Open ${doc.name} profile`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.07] hover:text-cyan-400 dark:text-slate-600 dark:hover:text-cyan-400"
                        >
                          <ArrowUpRight size={15} />
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
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredDoctors.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {doctors.length}
              </span>{' '}
              specialists
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Clinical network synchronized
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Doctors;