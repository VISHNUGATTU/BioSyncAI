import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit,
  Trash2,
  FlaskConical,
  Search,
  Plus,
  X,
  TestTube2,
  DollarSign,
  Clock3,
  CheckCircle2,
  XCircle,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

import api from '../api/axios';

const LabTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const [newTest, setNewTest] = useState({
    testName: '',
    testCode: '',
    category: '',
    sampleType: 'Blood',
    basePrice: '',
    fastingRequired: false,
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);

      const res = await api.get('/tests/admin');

      if (res.data.success) {
        setTests(res.data.data);
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
      const payload = {
        testName: newTest.testName,
        testCode: newTest.testCode,
        category: newTest.category,
        sampleType: newTest.sampleType,
        pricing: {
          basePrice: Number(newTest.basePrice),
        },
        fastingRequired: newTest.fastingRequired,
      };

      const res = await api.post('/tests', payload);

      if (res.data.success) {
        setShowModal(false);

        setNewTest({
          testName: '',
          testCode: '',
          category: '',
          sampleType: 'Blood',
          basePrice: '',
          fastingRequired: false,
        });

        fetchTests();
      }
    } catch (error) {
      alert('Error creating test. Please check inputs.');
      console.error(error);
    }
  };

  const filteredTests = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return tests;
    }

    return tests.filter((test) => {
      return (
        test.testName?.toLowerCase().includes(query) ||
        test.testCode?.toLowerCase().includes(query) ||
        test.category?.toLowerCase().includes(query) ||
        test.sampleType?.toLowerCase().includes(query)
      );
    });
  }, [tests, search]);

  const activeTests = tests.filter((test) => test.isActive).length;

  const getSampleClasses = (sampleType) => {
    switch (sampleType?.toLowerCase()) {
      case 'blood':
        return 'border-red-400/15 bg-red-400/[0.07] text-red-400';

      case 'urine':
        return 'border-amber-400/15 bg-amber-400/[0.07] text-amber-400';

      case 'saliva':
        return 'border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400';

      case 'stool':
        return 'border-orange-400/15 bg-orange-400/[0.07] text-orange-400';

      case 'swab':
        return 'border-violet-400/15 bg-violet-400/[0.07] text-violet-400';

      default:
        return 'border-slate-400/15 bg-slate-400/[0.07] text-slate-400';
    }
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
              Diagnostics
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
            Lab & Test Management
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
            Manage available tests, pricing, sample requirements and
            availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.7)]" />
            {activeTests} active tests
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(14,165,233,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(14,165,233,0.25)]"
          >
            <Plus size={16} />
            Add New Test
          </button>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Diagnostic Catalog
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              {filteredTests.length} test
              {filteredTests.length !== 1 ? 's' : ''} currently shown
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[280px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
              />

              <input
                type="search"
                placeholder="Search tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
              />
            </div>

            <button
              type="button"
              onClick={fetchTests}
              disabled={loading}
              title="Refresh tests"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-300"
            >
              <RefreshCw
                size={15}
                className={loading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Test
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Category
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Sample
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Price
                </th>

                <th className="px-6 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Preparation
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

                      <p className="text-xs font-medium text-slate-500">
                        Loading diagnostic catalog...
                      </p>
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
                        {search
                          ? 'No matching tests'
                          : 'No tests available'}
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                        {search
                          ? 'Try a different test name, code or category.'
                          : 'Add a diagnostic test to build the catalog.'}
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
                    {/* Test */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400">
                          <FlaskConical size={16} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {test.testName}
                          </p>

                          <p className="mt-0.5 font-mono text-[10px] font-medium text-slate-400 dark:text-slate-600">
                            {test.testCode}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {test.category || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Sample */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getSampleClasses(
                          test.sampleType
                        )}`}
                      >
                        <TestTube2 size={12} />
                        {test.sampleType || 'Unknown'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <DollarSign
                          size={13}
                          className="text-slate-400 dark:text-slate-600"
                        />

                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {Number(test.pricing?.basePrice || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Fasting */}
                    <td className="px-6 py-4">
                      {test.fastingRequired ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/15 bg-amber-400/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                          <Clock3 size={12} />
                          Required
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-600">
                          Not required
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                          test.isActive
                            ? 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-400'
                            : 'border-slate-400/15 bg-slate-400/[0.08] text-slate-400'
                        }`}
                      >
                        {test.isActive ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}

                        {test.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit"
                          aria-label={`Edit ${test.testName}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete ${test.testName}`}
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
        {!loading && filteredTests.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 px-5 py-3.5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              Showing{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {filteredTests.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {tests.length}
              </span>{' '}
              tests
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Diagnostic catalog synchronized
            </div>
          </div>
        )}
      </section>

      {/* Add Test Modal */}
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
                  <FlaskConical size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add New Test
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                    Create a new diagnostic test in the catalog
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
              onSubmit={handleCreateTest}
              className="max-h-[calc(100vh-180px)] overflow-y-auto px-5 py-5 sm:px-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Test name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Test Name
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Complete Blood Count"
                    value={newTest.testName}
                    onChange={(e) =>
                      setNewTest({
                        ...newTest,
                        testName: e.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                {/* Test code */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Test Code
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. CBC-01"
                    value={newTest.testCode}
                    onChange={(e) =>
                      setNewTest({
                        ...newTest,
                        testCode: e.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Category
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Hematology"
                    value={newTest.category}
                    onChange={(e) =>
                      setNewTest({
                        ...newTest,
                        category: e.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                </div>

                {/* Sample type */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Sample Type
                  </label>

                  <div className="relative">
                    <select
                      value={newTest.sampleType}
                      onChange={(e) =>
                        setNewTest({
                          ...newTest,
                          sampleType: e.target.value,
                        })
                      }
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="Blood">Blood</option>
                      <option value="Urine">Urine</option>
                      <option value="Saliva">Saliva</option>
                      <option value="Stool">Stool</option>
                      <option value="Swab">Swab</option>
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                    Base Price
                  </label>

                  <div className="relative">
                    <DollarSign
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newTest.basePrice}
                      onChange={(e) =>
                        setNewTest({
                          ...newTest,
                          basePrice: e.target.value,
                        })
                      }
                      required
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                {/* Fasting */}
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={newTest.fastingRequired}
                      onChange={(e) =>
                        setNewTest({
                          ...newTest,
                          fastingRequired: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-cyan-500 accent-cyan-500 dark:border-slate-700"
                    />

                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Fasting required
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                        Patients must fast before providing the sample.
                      </p>
                    </div>
                  </label>
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
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-xs font-semibold text-white shadow-[0_7px_20px_rgba(14,165,233,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(14,165,233,0.22)]"
                >
                  <Plus size={15} />
                  Save Test
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