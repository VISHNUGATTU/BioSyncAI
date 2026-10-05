import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit,
  FlaskConical,
  Search,
  Plus,
  X,
  TestTube2,
  Clock3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
} from 'lucide-react';

import api from '../api/axios';

const LabTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const [newTest, setNewTest] = useState({
    testName: '',
    testCode: '',
    category: 'Hematology',
    sampleType: 'Blood',
    basePrice: '',
    fastingRequired: false,
    isActive: true,
  });

  const [editingTest, setEditingTest] = useState(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tests/admin');

      if (res.data.success) {
        setTests(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        testName: newTest.testName,
        testCode: newTest.testCode,
        category: newTest.category,
        sampleType: newTest.sampleType,
        pricing: {
          basePrice: Number(newTest.basePrice),
        },
        fastingRequired: newTest.fastingRequired,
        isActive: newTest.isActive,
      };

      const res = await api.post('/tests', payload);

      if (res.data.success) {
        setShowCreateModal(false);
        setNewTest({
          testName: '',
          testCode: '',
          category: 'Hematology',
          sampleType: 'Blood',
          basePrice: '',
          fastingRequired: false,
          isActive: true,
        });
        fetchTests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating test. Please check inputs.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (test) => {
    setEditingTest({
      _id: test._id,
      testName: test.testName || '',
      testCode: test.testCode || '',
      category: test.category || 'General',
      sampleType: test.sampleType || 'Blood',
      basePrice: test.pricing?.basePrice || 0,
      fastingRequired: Boolean(test.fastingRequired),
      isActive: Boolean(test.isActive),
    });
    setShowEditModal(true);
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    if (!editingTest) return;

    try {
      setSaving(true);
      const payload = {
        testName: editingTest.testName,
        testCode: editingTest.testCode,
        category: editingTest.category,
        sampleType: editingTest.sampleType,
        pricing: {
          basePrice: Number(editingTest.basePrice),
        },
        fastingRequired: editingTest.fastingRequired,
        isActive: editingTest.isActive,
      };

      const res = await api.put(`/tests/${editingTest._id}`, payload);
      if (res.data.success) {
        setShowEditModal(false);
        fetchTests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating test.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTestActive = async (test) => {
    try {
      const updatedStatus = !test.isActive;
      const res = await api.put(`/tests/${test._id}`, { isActive: updatedStatus });
      if (res.data.success) {
        setTests((prev) =>
          prev.map((t) => (t._id === test._id ? { ...t, isActive: updatedStatus } : t))
        );
      }
    } catch (error) {
      console.error('Error toggling test status:', error);
    }
  };

  const filteredTests = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return tests;

    return tests.filter((test) => {
      const name = test.testName?.toLowerCase() || '';
      const code = test.testCode?.toLowerCase() || '';
      const category = test.category?.toLowerCase() || '';
      return name.includes(query) || code.includes(query) || category.includes(query);
    });
  }, [tests, search]);

  const stats = useMemo(() => {
    const active = tests.filter((t) => t.isActive).length;
    return {
      total: tests.length,
      active,
      inactive: tests.length - active,
      fasting: tests.filter((t) => t.fastingRequired).length,
    };
  }, [tests]);

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
              Laboratory Catalog
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Lab Tests
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Define medical diagnostics, fasting parameters, and specimen collection pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTests}
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
            Add Lab Test
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
              Catalog Items
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-400">
              <FlaskConical size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Total diagnostic tests offered
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
              Active Tests
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
            {stats.active}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Bookable by patient mobile app
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">
              Fasting Required
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/[0.08] text-amber-400">
              <Clock3 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-500 sm:text-3xl">
            {stats.fasting}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Mandatory overnight fasting
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Inactive
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-400/[0.08] text-slate-400">
              <XCircle size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-500 sm:text-3xl">
            {stats.inactive}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-600">
            Suspended or out of reagents
          </p>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Medical Test Specifications
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              Diagnostic assay pricing and specimen requirements
            </p>
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
            />
            <input
              type="search"
              placeholder="Search test name, code, category..."
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
                  Test Name & Code
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Category
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Specimen Type
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Base Price
                </th>
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Fasting
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
                      <p className="text-xs font-medium text-slate-500">Loading catalog...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600">
                        <FlaskConical size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No tests found
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        Try modifying search query or add a new test.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTests.map((test) => (
                  <tr
                    key={test._id}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                  >
                    {/* Test Name & Code */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-500">
                          <FlaskConical size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {test.testName}
                          </p>
                          <p className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                            {test.testCode || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {test.category || 'General'}
                      </span>
                    </td>

                    {/* Specimen Type */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <TestTube2 size={13} className="text-slate-400" />
                        <span>{test.sampleType || 'Blood'}</span>
                      </div>
                    </td>

                    {/* Base Price */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        ₹{Number(test.pricing?.basePrice || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Fasting */}
                    <td className="px-6 py-4">
                      {test.fastingRequired ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          <Clock3 size={11} />
                          Fasting
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Non-Fasting</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleTestActive(test)}
                        title="Click to toggle availability"
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                          test.isActive
                            ? 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400 hover:bg-emerald-400/[0.15]'
                            : 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400 hover:bg-slate-400/[0.15]'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {test.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(test)}
                          title="Edit Lab Test"
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
        {!loading && filteredTests.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing <span className="text-slate-600 dark:text-slate-400">{filteredTests.length}</span>{' '}
              of <span className="text-slate-600 dark:text-slate-400">{tests.length}</span> tests
            </p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Diagnostic catalog synchronized
            </div>
          </div>
        )}
      </section>

      {/* Add Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowCreateModal(false)} />

          <div className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1220]">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-400">
                  <FlaskConical size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add Diagnostic Test
                  </h2>
                  <p className="text-[10px] text-slate-400">Publish new test to diagnostic catalog</p>
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

            <form onSubmit={handleCreateTest} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Test Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={newTest.testName}
                  onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Test Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBC-01"
                    value={newTest.testCode}
                    onChange={(e) => setNewTest({ ...newTest, testCode: e.target.value.toUpperCase() })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hematology, Lipid Profile"
                    value={newTest.category}
                    onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Specimen Type
                  </label>
                  <select
                    value={newTest.sampleType}
                    onChange={(e) => setNewTest({ ...newTest, sampleType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Blood">Blood</option>
                    <option value="Urine">Urine</option>
                    <option value="Saliva">Saliva</option>
                    <option value="Swab">Swab</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="499"
                    value={newTest.basePrice}
                    onChange={(e) => setNewTest({ ...newTest, basePrice: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTest.fastingRequired}
                    onChange={(e) => setNewTest({ ...newTest, fastingRequired: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Fasting Required (8-12 hours)
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTest.isActive}
                    onChange={(e) => setNewTest({ ...newTest, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Active for booking
                </label>
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
                  {saving ? 'Creating...' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {showEditModal && editingTest && (
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
                    Edit Diagnostic Test
                  </h2>
                  <p className="text-[10px] text-slate-400">Update pricing and test specifications</p>
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

            <form onSubmit={handleUpdateTest} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Test Name
                </label>
                <input
                  type="text"
                  required
                  value={editingTest.testName}
                  onChange={(e) => setEditingTest({ ...editingTest, testName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Test Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTest.testCode}
                    onChange={(e) => setEditingTest({ ...editingTest, testCode: e.target.value.toUpperCase() })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTest.category}
                    onChange={(e) => setEditingTest({ ...editingTest, category: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Specimen Type
                  </label>
                  <select
                    value={editingTest.sampleType}
                    onChange={(e) => setEditingTest({ ...editingTest, sampleType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Blood">Blood</option>
                    <option value="Urine">Urine</option>
                    <option value="Saliva">Saliva</option>
                    <option value="Swab">Swab</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingTest.basePrice}
                    onChange={(e) => setEditingTest({ ...editingTest, basePrice: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTest.fastingRequired}
                    onChange={(e) => setEditingTest({ ...editingTest, fastingRequired: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Fasting Required
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTest.isActive}
                    onChange={(e) => setEditingTest({ ...editingTest, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Active for booking
                </label>
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

export default LabTests;