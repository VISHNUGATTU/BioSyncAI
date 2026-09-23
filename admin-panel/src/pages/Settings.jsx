import React, { useEffect, useState } from 'react';
import {
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  ShieldCheck,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

import useAuthStore from '../store/authStore';
import api from '../api/axios';

const Settings = () => {
  const admin = useAuthStore((state) => state.admin);
  const updateAdmin = useAuthStore((state) => state.updateAdmin);

  const [profile, setProfile] = useState({
    firstName: admin?.firstName || '',
    lastName: admin?.lastName || '',
    email: admin?.email || '',
    phoneNumber: admin?.phoneNumber || '',
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile({
      firstName: admin?.firstName || '',
      lastName: admin?.lastName || '',
      email: admin?.email || '',
      phoneNumber: admin?.phoneNumber || '',
    });
  }, [admin]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    setSuccessMsg('');
    setErrorMsg('');
    setSaving(true);

    try {
      const payload = {
        ...profile,
      };

      if (password.trim()) {
        payload.password = password;
      }

      const res = await api.put('/admin/profile', payload);

      if (res.data.success) {
        if (res.data.admin) {
          updateAdmin(res.data.admin);
        } else {
          updateAdmin({
            ...admin,
            ...profile,
          });
        }

        setPassword('');
        setSuccessMsg('Profile updated successfully.');

        setTimeout(() => {
          setSuccessMsg('');
        }, 3000);
      } else {
        setErrorMsg(
          res.data.message || 'Unable to update your profile.'
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);

      setErrorMsg(
        error.response?.data?.message ||
          'Error updating profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMsg('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
            Account Configuration
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
          Settings
        </h1>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
          Manage your administrator profile and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main profile card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          {/* Card header */}
          <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800/80 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-400">
                <UserRound size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Profile Information
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                  Update the information associated with your administrator
                  account.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-5 p-5 sm:p-6">
              {/* Success */}
              {successMsg && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-emerald-500 dark:text-emerald-400">
                  <CheckCircle2 size={17} />

                  <p className="text-xs font-medium">
                    {successMsg}
                  </p>
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-xs font-medium text-red-500 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500"
                  >
                    First Name
                  </label>

                  <div className="relative">
                    <UserRound
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                    />

                    <input
                      id="firstName"
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        updateField('firstName', e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                      placeholder="First name"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500"
                  >
                    Last Name
                  </label>

                  <div className="relative">
                    <UserRound
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                    />

                    <input
                      id="lastName"
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        updateField('lastName', e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500"
                >
                  Email Address
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold tracking-normal text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-600">
                    READ ONLY
                  </span>
                </label>

                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                  />

                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    readOnly
                    className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/80 pl-10 pr-4 text-sm text-slate-500 opacity-80 outline-none dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500"
                >
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                  />

                  <input
                    id="phoneNumber"
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) =>
                      updateField('phoneNumber', e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500"
                >
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSuccessMsg('');
                      setErrorMsg('');
                    }}
                    placeholder="Leave blank to keep current password"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400/50 focus:bg-white focus:ring-4 focus:ring-violet-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-300"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-600">
                  Only enter a password when you want to change your current
                  credentials.
                </p>
              </div>
            </div>

            {/* Form footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[10px] text-slate-400 dark:text-slate-600">
                Changes are applied to your administrator account.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-xs font-bold text-white shadow-lg shadow-cyan-500/15 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Save size={15} />
                )}

                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Security side panel */}
        <aside className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-violet-400/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07] text-violet-400">
                <ShieldCheck size={19} />
              </div>

              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Administrator Security
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-500">
                Keep your administrator credentials current to maintain secure
                access to the BioSync AI control plane.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 dark:border-slate-800/80 dark:bg-slate-900/40">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
              Account Status
            </p>

            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>

              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Administrator account active
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                  Secure access enabled
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Settings;